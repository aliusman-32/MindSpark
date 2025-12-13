from kokoro import KPipeline
import torch
import wave
import numpy as np
from diffusers import AudioLDMPipeline
from pydub import AudioSegment
import re
import os 

class AudioGenerator:
    def __init__(self):
        self.pipe_narration = KPipeline("a", repo_id="hexgrad/Kokoro-82M")  # 'a' = American English
        self.audio_dir = "Audio"
        # create folder if it doesn't exist
        os.makedirs(self.audio_dir, exist_ok=True)
      
    def generate(self,script_text,audio_filename):
        PAUSE_MS = 800  # 0.8 second pause (change as you like)
        script_text_clean = re.sub(r"\*\*Pause\*\*", "", script_text)

        result = self.pipe_narration(script_text_clean, voice="af_jessica")
        # Collect audio tensors
        audio_tensors = []
        for chunk in result:
            if len(chunk) < 3:
                continue
            tensor = chunk[2]
            if tensor.ndim > 1:
                tensor = tensor.mean(dim=0)
            audio_tensors.append(tensor)

        full_audio = torch.cat(audio_tensors, dim=-1).cpu().numpy()
        full_audio = full_audio / np.max(np.abs(full_audio))  # normalize
        int16_audio = (full_audio * 32767).astype(np.int16)

        narration_file = os.path.join(self.audio_dir, f"narration_{audio_filename}.wav")
        narration_sample_rate = 24000
        with wave.open(str(narration_file), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(narration_sample_rate)
            wf.writeframes(int16_audio.tobytes())

        print(f"✅ Narration saved: {narration_file}")

        narration_audio = AudioSegment.from_wav(str(narration_file))
        pause_positions = [m.start() for m in re.finditer(r"\*\*Pause\*\*", script_text)]

        script_words = re.split(r'\s+', script_text)
        total_words = len(script_words)
        total_duration_ms = len(narration_audio)

        for pos in pause_positions:
            words_before = len(re.split(r'\s+', script_text[:pos]))
            pause_time_ms = int((words_before / total_words) * total_duration_ms)

            silence = AudioSegment.silent(duration=PAUSE_MS)
            narration_audio = (
                narration_audio[:pause_time_ms]
                + silence
                + narration_audio[pause_time_ms:]
            )
        
        # ----------------------------
        # 2. Parse SFX with exact position
        # ----------------------------
        sfx_matches = list(re.finditer(r"\[SFX:(.*?)\]", script_text))
        if sfx_matches:
            # Load narration to measure duration
            narration_audio = AudioSegment.from_wav(str(narration_file))
            total_duration_ms = len(narration_audio)  # in milliseconds

            # Split script by words for timing
            script_words = re.split(r'\s+', script_text)
            total_words = len(script_words)

            # Initialize AudioLDM v1 pipeline
            device = "cuda" if torch.cuda.is_available() else "cpu"
            pipe_sfx = AudioLDMPipeline.from_pretrained(
                "cvssp/audioldm-s-full-v2", torch_dtype=torch.float32
            ).to(device)

            mixed_audio = narration_audio

            for i, match in enumerate(sfx_matches):
                sfx_prompt = match.group(1).strip()
                # Compute approximate word index of this SFX
                sfx_start_char = match.start()
                words_before_sfx = len(re.split(r'\s+', script_text[:sfx_start_char]))
                # Estimate position in ms
                sfx_position_ms = int((words_before_sfx / total_words) * total_duration_ms)

                # Generate SFX
                print(f"Generating SFX {i+1}/{len(sfx_matches)}: '{sfx_prompt}'")
                sfx_output = pipe_sfx(
                    sfx_prompt,
                    num_inference_steps=20,
                    audio_length_in_s=5.0,
                    guidance_scale=2.5
                )
                audio_sfx_np = sfx_output.audios[0]
                audio_sfx_np /= np.max(np.abs(audio_sfx_np))
                audio_sfx_int16 = (audio_sfx_np * 32767).astype(np.int16)

                sfx_audio = AudioSegment(
                        audio_sfx_int16.tobytes(),
                        frame_rate=16000,
                        sample_width=2,   # int16 = 2 bytes
                        channels=1
                    )

                # Overlay SFX at correct position
                sfx_audio = sfx_audio.set_frame_rate(narration_sample_rate).set_channels(1)
                sfx_audio = sfx_audio - 5  # reduce volume
                mixed_audio = mixed_audio.overlay(sfx_audio, position=sfx_position_ms)

            final_file = os.path.join(self.audio_dir, f"{audio_filename}.wav")
            mixed_audio.export(final_file, format="wav")
            print(f"✅ Final mixed track saved: {final_file}")
            return 0
        
        else:
            print("No SFX tags found in script. Only narration generated")
        return  1