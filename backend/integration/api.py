import asyncio
import concurrent.futures
import json
import os
import sys
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict

# Add project root to path so we can import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Add ScriptGenerator directory to path so its sibling modules can be found
script_gen_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'ScriptGenerator')
if script_gen_path not in sys.path:
    sys.path.insert(0, script_gen_path)

from backend.model.ScriptGenerator.scriptGenerator import ScriptGenerator
from backend.model.VoiceLab.audio_generator import AudioGenerator
from backend.model.ScriptGenerator.podcastPipeline import PodcastPipeline
from backend.model.AgeClassifier import AgeContentGuard
from backend.model.VideoGenerator import VideoGenerator   # new import

from database import get_db, ContentPrompt, VisualLesson, ChildProfile
from sqlalchemy.orm import Session
from script_clean import clean_script_for_display

router = APIRouter()
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# Initialize models once
script_generator = ScriptGenerator()
print("GOOGLE_API_KEY is set:", os.getenv("GOOGLE_API_KEY") is not None)
audio_generator = AudioGenerator()
podcast_pipeline = PodcastPipeline()

# Initialize the age classifier
age_guard = AgeContentGuard()

# ------------------- Pydantic models -------------------
class ScriptRequest(BaseModel):
    child_id: int
    prompt_text: str
    chapters: Optional[List[Dict]] = None
    target_duration_minutes: float
    category_id: Optional[int] = 1
    difficulty_level: Optional[str] = "beginner"

class ScriptResponse(BaseModel):
    script: str
    display_script: str
    word_count: int
    estimated_speaking_time: float
    target_word_count: int
    target_duration: float
    duration_accuracy: float
    prompt_id: int
    lesson_id: int
    prompt_modified: Optional[bool] = False
    safety_message: Optional[str] = None

class AudioRequest(BaseModel):
    child_id: int
    lesson_id: int
    script_text: str
    audio_filename: str

class AudioResponse(BaseModel):
    pause_positions: list
    audio_path: str
    audio_url: str
    pause_file: str
    lesson_id: int

class VideoRequest(BaseModel):
    lesson_id: int
    project_name: Optional[str] = None

class VideoResponse(BaseModel):
    video_url: str
    video_path: str
    lesson_id: int

# ------------------- Endpoint 1: Generate Script -------------------
@router.post("/generate-script", response_model=ScriptResponse)
async def generate_script(request: ScriptRequest, db: Session = Depends(get_db)):
    loop = asyncio.get_event_loop()
    try:
        # ----- Step 1: Check the user's prompt for safety -----
        prompt_check = age_guard.process_prompt(request.prompt_text)
        if prompt_check["status"] == "rejected":
            raise HTTPException(
                status_code=400,
                detail=f"Prompt rejected: {prompt_check['message']}"
            )

        # ----- Step 2: Generate the script using the pipeline -----
        current_prompt = request.prompt_text
        prompt_modified = False
        safety_message = None

        result = await loop.run_in_executor(
            executor,
            podcast_pipeline.generate_timed_script,
            current_prompt,
            request.target_duration_minutes
        )
        raw_script = result['script']
        chapters = result.get('chapters', [])          # get chapters for later use

        # ----- Step 3: Check the generated script for safety -----
        script_check = age_guard.check_script(raw_script)
        if script_check.startswith("UNSAFE"):
            safety_message = script_check
            safe_prompt = age_guard.make_safe_prompt(request.prompt_text)
            result = await loop.run_in_executor(
                executor,
                podcast_pipeline.generate_timed_script,
                safe_prompt,
                request.target_duration_minutes
            )
            raw_script = result['script']
            chapters = result.get('chapters', [])
            prompt_modified = True

        # Clean script for display
        display_script = clean_script_for_display(raw_script)

        # Map pipeline result fields
        word_count = result.get('word_count', 0)
        estimated_time = result.get('actual_duration_minutes', 0)
        target_word_count = 0
        duration_accuracy = result.get('duration_accuracy_minutes', 999)

        # ----- Step 4: Save to database (including chapters) -----
        new_prompt = ContentPrompt(
            child_id=request.child_id,
            prompt_text=request.prompt_text,
            generated_topic=raw_script
        )
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)

        title = raw_script[:50] + "..." if len(raw_script) > 50 else raw_script
        chapters_json = json.dumps(chapters) if chapters else None
        new_lesson = VisualLesson(
            category_id=request.category_id,
            prompt_id=new_prompt.prompt_id,
            title=title,
            description=raw_script,
            duration_seconds=int(estimated_time * 60),
            difficulty_level=request.difficulty_level,
            chapters_json=chapters_json                 # store chapters
        )
        db.add(new_lesson)
        db.commit()
        db.refresh(new_lesson)

        # ----- Step 5: Return response -----
        return ScriptResponse(
            script=raw_script,
            display_script=display_script,
            word_count=word_count,
            estimated_speaking_time=estimated_time,
            target_word_count=target_word_count,
            target_duration=request.target_duration_minutes,
            duration_accuracy=duration_accuracy,
            prompt_id=new_prompt.prompt_id,
            lesson_id=new_lesson.lesson_id,
            prompt_modified=prompt_modified,
            safety_message=safety_message
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")
    finally:
        db.close()

# ------------------- Endpoint 2: Generate Audio -------------------
@router.post("/generate-audio", response_model=AudioResponse)
async def generate_audio(request: AudioRequest, db: Session = Depends(get_db)):
    loop = asyncio.get_event_loop()
    try:
        pause_positions = await loop.run_in_executor(
            executor,
            audio_generator.generate,
            request.script_text,
            request.audio_filename
        )
        audio_path = os.path.join("Audio", f"{request.audio_filename}.wav")
        pause_file = os.path.join("Audio", f"{request.audio_filename}_pauses.txt")
        audio_url = f"/audio/{request.audio_filename}.wav"

        lesson = db.query(VisualLesson).filter(VisualLesson.lesson_id == request.lesson_id).first()
        if lesson:
            lesson.narration = audio_path
            # Also store pause positions for later video generation
            lesson.pause_positions_json = json.dumps(pause_positions)
            db.commit()

        return AudioResponse(
            pause_positions=pause_positions,
            audio_path=audio_path,
            audio_url=audio_url,
            pause_file=pause_file,
            lesson_id=request.lesson_id
        )
    except Exception as e:
        import traceback
        print("="*50)
        print("ERROR in /generate-audio:")
        traceback.print_exc()
        print("="*50)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")
    finally:
        db.close()

# ------------------- Endpoint 3: Generate Video -------------------
@router.post("/generate-video", response_model=VideoResponse)
async def generate_video(request: VideoRequest, db: Session = Depends(get_db)):
    loop = asyncio.get_event_loop()
    try:
        # 1. Get the lesson from DB
        lesson = db.query(VisualLesson).filter(VisualLesson.lesson_id == request.lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        if not lesson.chapters_json or not lesson.narration or not lesson.pause_positions_json:
            raise HTTPException(status_code=400, detail="Missing chapters, audio, or pause positions for this lesson")

        # 2. Parse chapters and pause positions
        chapters = json.loads(lesson.chapters_json)
        pause_positions = json.loads(lesson.pause_positions_json)

        # 3. Build full path to audio file
        # lesson.narration is stored as relative path (e.g., "Audio/lesson_X.wav")
        # The audio file is actually in the Audio folder relative to the backend/integration directory.
        audio_full_path = os.path.join(os.path.dirname(__file__), lesson.narration)
        if not os.path.exists(audio_full_path):
            # Try alternative if the path is absolute or from root
            alt_path = os.path.join(os.getcwd(), lesson.narration)
            if os.path.exists(alt_path):
                audio_full_path = alt_path
            else:
                raise HTTPException(status_code=500, detail="Audio file not found")

        project_name = request.project_name or f"lesson_{request.lesson_id}"

        # 4. Run video generator in thread with improved parameters
        video_gen = VideoGenerator(
            chapters=chapters,
            audio_path=audio_full_path,
            pause_positions_ms=pause_positions,
            project_name=project_name,
            output_dir="video",
            colab_url=os.getenv("COLAB_API_URL"),
            steps=50,              # higher quality, slower
            guidance=9.0,
            negative_prompt="blurry, low quality, distorted, text, watermark, ugly, deformed, extra limbs, extra fingers, mutated"
        )
        video_path = await loop.run_in_executor(executor, video_gen.run)

        # 5. Return public URL
        video_url = f"/video/{project_name}/{project_name}_video.mp4"
        return VideoResponse(
            video_url=video_url,
            video_path=video_path,
            lesson_id=request.lesson_id
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("="*50)
        print("ERROR in /generate-video:")
        traceback.print_exc()
        print("="*50)
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")