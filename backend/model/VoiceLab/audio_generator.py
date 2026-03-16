from kokoro import KPipeline
import torch
import numpy as np
from diffusers import AudioLDMPipeline
from pydub import AudioSegment
import re
import os


class AudioGenerator:
    def __init__(self):
        self.pipe_narration = KPipeline("a", repo_id="hexgrad/Kokoro-82M")

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.sr = 24000
        self.audio_dir = "Audio"
        os.makedirs(self.audio_dir, exist_ok=True)

        self.pipe_sfx = AudioLDMPipeline.from_pretrained(
            "cvssp/audioldm-s-full-v2",
            torch_dtype=torch.float32
        ).to(self.device)

        # narration speed ( <1 = slower, >1 = faster )
        self.narration_speed = 0.85
        self.emphasis_gain = 6

    # --------------------------------------------------
    # Parse script into timeline
    # --------------------------------------------------
    def parse_timeline(self, script):
        timeline = []
        cursor = 0
        first_pause_handled = False  # Track first chapter-start pause

        pattern = r"\*\*\[PAUSE\]\*\*|\[PAUSE(?:\s*[\d.]+s)?\]|\[SFX:(.*?)\]|\*(.*?)\*"

        for match in re.finditer(pattern, script):
            if match.start() > cursor:
                text_segment = script[cursor:match.start()].strip()
                if text_segment:
                    timeline.append(("TEXT", text_segment))

            matched = match.group(0)
            pre_char = script[match.start()-1] if match.start() > 0 else ""
            post_char = script[match.end():match.end()+1] if match.end() < len(script) else ""

            # First chapter-start pause
            if not first_pause_handled and (matched.startswith("[PAUSE") or matched == "**[PAUSE]**") and post_char == "\n":
                timeline.append(("pause_position", 1000))
                first_pause_handled = True
            # Pauses surrounded by newlines in the middle of script
            elif (matched.startswith("[PAUSE") or matched == "**[PAUSE]**") and pre_char == "\n" and post_char == "\n":
                timeline.append(("pause_position", 1000))
            # Other pauses
            elif matched.startswith("[PAUSE") or matched == "**[PAUSE]**":
                timeline.append(("PAUSE", 500))
            # SFX
            elif match.group(1):
                timeline.append(("SFX", match.group(1).strip()))
            # Emphasis
            elif match.group(2):
                timeline.append(("TEXT", match.group(2), {}))

            cursor = match.end()

        if cursor < len(script):
            remaining_text = script[cursor:].strip()
            if remaining_text:
                timeline.append(("TEXT", remaining_text))

        return timeline

    # --------------------------------------------------
    # Generate narration chunk
    # --------------------------------------------------
    def generate_narration(self, text):
        result = self.pipe_narration(text, voice="af_jessica")

        chunks = []
        for chunk in result:
            if len(chunk) < 3:
                continue
            t = chunk[2]
            if t.ndim > 1:
                t = t.mean(dim=0)
            chunks.append(t)

        audio = torch.cat(chunks).cpu().numpy()
        audio /= np.max(np.abs(audio))
        audio = (audio * 32767).astype(np.int16)

        seg = AudioSegment(
            audio.tobytes(),
            frame_rate=self.sr,
            sample_width=2,
            channels=1
        )

        # speed control
        seg = seg._spawn(
            seg.raw_data,
            overrides={"frame_rate": int(seg.frame_rate * self.narration_speed)}
        ).set_frame_rate(self.sr)

        return seg

    # --------------------------------------------------
    # MAIN FUNCTION
    # --------------------------------------------------
    def generate(self, script_text, audio_filename):

        timeline = self.parse_timeline(script_text)

        final_audio = AudioSegment.silent(0)
        pause_positions = []
        sfx_events = []

        current_time = 0

        for block in timeline:

            if block[0] == "TEXT":
                narration = self.generate_narration(block[1])
                final_audio += narration
                current_time += len(narration)

            elif block[0] == "pause_position":
                pause_positions.append(current_time)
                silence = AudioSegment.silent(block[1])
                final_audio += silence
                current_time += block[1]

            elif block[0] == "SFX":
                sfx_events.append((current_time, block[1]))

        # --------------------------------------------------
        # Overlay SFX
        # --------------------------------------------------
        mixed_audio = final_audio

        for pos, prompt in sfx_events:
            print(f"Generating SFX: {prompt}")

            out = self.pipe_sfx(
                prompt,
                num_inference_steps=20,
                audio_length_in_s=5.0,
                guidance_scale=2.5
            )

            sfx = out.audios[0]
            sfx /= np.max(np.abs(sfx))
            sfx = (sfx * 32767).astype(np.int16)

            sfx_audio = AudioSegment(
                sfx.tobytes(),
                frame_rate=16000,
                sample_width=2,
                channels=1
            ).set_frame_rate(self.sr) - 15

            mixed_audio = mixed_audio.overlay(sfx_audio, position=pos)

        # --------------------------------------------------
        # Save files
        # --------------------------------------------------
        audio_path = os.path.join(self.audio_dir, f"{audio_filename}.wav")
        mixed_audio.export(audio_path, format="wav")

        pause_file = os.path.join(self.audio_dir, f"{audio_filename}_pauses.txt")
        with open(pause_file, "w") as f:
            for i, t in enumerate(pause_positions, 1):
                f.write(f"PAUSE {i}: {t} ms\n")

        print("✅ Narration, pauses, and SFX generated correctly")
        print("✅ Natural pauses (no shock)")
        print("✅ Pause timestamps saved")

        return pause_positions
