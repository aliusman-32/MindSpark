import os
import requests
import base64
import time
from PIL import Image, ImageDraw, ImageFont
from moviepy import ImageClip, concatenate_videoclips, AudioFileClip
from pydub import AudioSegment
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

class VideoGenerator:
    def __init__(self, chapters, audio_path, pause_positions_ms, project_name,
                 output_dir="video", colab_url=None,
                 steps=50, guidance=9.0, negative_prompt=None):
        """
        chapters: list of dicts with keys 'title' and 'key_points'
        audio_path: full path to the .wav file
        pause_positions_ms: list of chapter start times in milliseconds
        project_name: name for the output folder/video file
        output_dir: base directory for video outputs
        colab_url: Google Colab public URL from ngrok (e.g., https://abc123.ngrok.io)
        steps: number of inference steps for image generation (higher = better quality, slower)
        guidance: classifier-free guidance scale (higher = closer to prompt)
        negative_prompt: things to avoid in the image
        """
        self.chapters = chapters
        self.audio_path = audio_path
        self.pause_positions_ms = pause_positions_ms
        self.project_name = project_name
        self.output_dir = output_dir
        self.project_folder = os.path.join(self.output_dir, self.project_name)
        self.frames_folder = os.path.join(self.project_folder, "frames")
        os.makedirs(self.frames_folder, exist_ok=True)

        # Generation parameters
        self.steps = steps
        self.guidance = guidance
        # Strong negative prompt to avoid text and artifacts
        self.negative_prompt = negative_prompt or (
            "blurry, low quality, distorted, text, watermark, ugly, deformed, "
            "extra limbs, extra fingers, mutated, letters, numbers, labels, "
            "diagram labels, words, writing, characters, symbols"
        )

        # Colab API configuration
        self.colab_url = colab_url or os.getenv("COLAB_API_URL")
        if not self.colab_url:
            raise ValueError(
                "Colab API URL is required. Set COLAB_API_URL in .env or pass colab_url."
            )
        self.colab_url = self.colab_url.rstrip('/')
        print(f"📡 Using Colab API: {self.colab_url}")

    def _call_colab_api(self, prompt, retries=5):
        """Call the Stable Diffusion API running on Colab with exponential backoff."""
        payload = {
            "prompt": prompt,
            "negative_prompt": self.negative_prompt,
            "steps": self.steps,
            "guidance_scale": self.guidance,
            "height": 512,
            "width": 512
        }

        for attempt in range(retries):
            # Exponential backoff: 1s, 2s, 4s, 8s, 16s
            wait_time = min(2 ** attempt, 16)

            try:
                response = requests.post(
                    f"{self.colab_url}/generate",
                    json=payload,
                    timeout=120  # Allow more time for slow generations
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        img_data = base64.b64decode(data['image'])
                        return Image.open(BytesIO(img_data))
                    else:
                        print(f"API error: {data.get('error')}")

                elif response.status_code == 503:
                    # Model is loading or the server is temporarily unavailable
                    print(f"Service unavailable (503) – waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue  # skip the generic wait at the end

                else:
                    print(f"HTTP error {response.status_code}: {response.text}")

            except requests.exceptions.Timeout:
                print(f"Request timeout (attempt {attempt+1}/{retries})")
            except requests.exceptions.ConnectionError as e:
                print(f"Connection error: {e}")
            except Exception as e:
                print(f"Request failed: {e}")

            # Wait before next retry (if not a 503, which already waited)
            if attempt < retries - 1:
                print(f"Retrying in {wait_time}s...")
                time.sleep(wait_time)

        return None

    def _create_title_slide(self, title, filename):
        """Create a title slide locally."""
        img = Image.new("RGB", (512, 512), color=(20, 20, 40))
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("DejaVuSans-Bold.ttf", 40)
        except:
            font = ImageFont.load_default()

        # Simple word wrap
        words = title.split()
        lines = []
        current_line = []
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] - bbox[0] <= 450:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        if current_line:
            lines.append(' '.join(current_line))

        # Center text
        line_height = 50
        total_height = len(lines) * line_height
        start_y = (512 - total_height) // 2

        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (512 - text_width) // 2
            y = start_y + i * line_height
            draw.text((x, y), line, fill=(255, 255, 255), font=font)

        img.save(filename)

    def _build_prompt(self, point, chapter_title=None):
        """
        Build a highly detailed prompt for a key point, optimized for children's educational illustrations.
        """
        base = f"{point}"
        style = (
            "simple educational diagram, bright colors, cartoon style, "
            "no text, no labels, no letters, no numbers, clean shapes, "
            "children's book illustration, cute, friendly, 2D, flat design"
        )
        context = f" related to {chapter_title}" if chapter_title else ""
        return f"{base}{context}, {style}"

    def generate_frames(self):
        """Generate all frames (title slides + images for key points)."""
        self.image_paths = []

        for chapter_index, chapter in enumerate(self.chapters):
            chapter_title = chapter.get("title", "")
            # Title slide (local)
            title_path = f"{self.frames_folder}/chapter_{chapter_index}_title.png"
            self._create_title_slide(chapter_title, title_path)
            self.image_paths.append(title_path)

            # Key point images (via Colab API)
            for i, point in enumerate(chapter["key_points"]):
                prompt = self._build_prompt(point, chapter_title)
                print(f"🖼️ Generating image {chapter_index}-{i}: {prompt[:80]}...")

                image = self._call_colab_api(prompt)

                if image is None:
                    print(f"⚠️ API failed, using fallback image")
                    image = Image.new("RGB", (512, 512), color=(73, 109, 137))

                image = image.resize((512, 512), Image.Resampling.LANCZOS)

                path = f"{self.frames_folder}/ch_{chapter_index}_scene_{i}.png"
                image.save(path)
                self.image_paths.append(path)

    def create_video(self, fps=24):
        """Assemble video from frames and audio, handling mismatched chapter durations."""
        final_video_path = os.path.join(self.project_folder, f"{self.project_name}_video.mp4")

        # Load audio
        audio = AudioSegment.from_wav(self.audio_path)
        total_audio_sec = len(audio) / 1000.0

        # Calculate durations for chapters that have pause positions
        chapter_durations = []
        for i in range(len(self.pause_positions_ms)):
            if i < len(self.pause_positions_ms) - 1:
                duration_ms = self.pause_positions_ms[i + 1] - self.pause_positions_ms[i]
            else:
                duration_ms = len(audio) - self.pause_positions_ms[i]  # Last chapter until end
            chapter_durations.append(duration_ms / 1000.0)

        # If there are more chapters than pause positions, distribute the remaining time
        if len(chapter_durations) < len(self.chapters):
            missing = len(self.chapters) - len(chapter_durations)
            used_time = sum(chapter_durations)
            remaining = max(0, total_audio_sec - used_time)
            extra_duration = remaining / missing if missing else 0
            chapter_durations.extend([extra_duration] * missing)

        # If there are more pause positions than chapters (unlikely), truncate
        chapter_durations = chapter_durations[:len(self.chapters)]

        # Build video clips
        clips = []
        frame_index = 0

        for chapter_index, chapter in enumerate(self.chapters):
            num_frames = len(chapter["key_points"]) + 1  # +1 for title
            if num_frames == 0:
                continue

            # Get duration for this chapter (fallback 5s if still missing)
            if chapter_index >= len(chapter_durations):
                duration = 5.0
            else:
                duration = chapter_durations[chapter_index]

            frame_duration = duration / num_frames

            for _ in range(num_frames):
                if frame_index >= len(self.image_paths):
                    break
                img_path = self.image_paths[frame_index]
                clips.append(ImageClip(img_path).with_duration(frame_duration))
                frame_index += 1

        if not clips:
            raise RuntimeError("No frames were generated.")

        # Compose video
        video = concatenate_videoclips(clips, method="compose")

        # Add audio
        audio_clip = AudioFileClip(self.audio_path)
        video = video.set_audio(audio_clip)

        # Export
        video.write_videofile(
            final_video_path,
            fps=fps,
            codec='libx264',
            audio_codec='aac',
            threads=4,
            preset='medium'
        )

        print(f"✅ Video saved at: {final_video_path}")
        return final_video_path

    def run(self):
        """Run the full generation pipeline."""
        self.generate_frames()
        return self.create_video()