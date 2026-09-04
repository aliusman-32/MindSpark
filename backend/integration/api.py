import asyncio
import concurrent.futures
import json
import os
import sys
import secrets
import hashlib
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict

# Add project root and ScriptGenerator path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
script_gen_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'ScriptGenerator')
if script_gen_path not in sys.path:
    sys.path.insert(0, script_gen_path)

from backend.model.ScriptGenerator.scriptGenerator import ScriptGenerator
from backend.model.VoiceLab.audio_generator import AudioGenerator
from backend.model.ScriptGenerator.podcastPipeline import PodcastPipeline
from backend.model.AgeClassifier import AgeContentGuard
from backend.model.VideoGenerator import VideoGenerator

from database import get_db, ContentPrompt, VisualLesson, ChildProfile, User, AssessmentResult, QuizAttempt
from sqlalchemy.orm import Session
from sqlalchemy import func
from script_clean import clean_script_for_display

router = APIRouter()
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

script_generator = ScriptGenerator()
print("GOOGLE_API_KEY is set:", os.getenv("GOOGLE_API_KEY") is not None)
audio_generator = AudioGenerator()
podcast_pipeline = PodcastPipeline()
age_guard = AgeContentGuard()


# ------------------- Auth helpers -------------------
def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"pbkdf2_sha256${salt.hex()}${password_hash.hex()}"

def _verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or not stored_hash.startswith("pbkdf2_sha256$"):
        return False
    try:
        _, salt_hex, hash_hex = stored_hash.split("$", 2)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return secrets.compare_digest(actual, expected)
    except Exception:
        return False

def _format_display_name(full_name: Optional[str], email: str):
    if full_name and full_name.strip():
        return full_name.strip()
    local_part = (email or "").split("@")[0].strip()
    return local_part.replace(".", " ").replace("_", " ").title() or "User"

# ------------------- Pydantic models -------------------
class SignupRequest(BaseModel):
    fullName: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

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

class AssessmentCreateRequest(BaseModel):
    child_id: int
    lesson_id: Optional[int] = None
    topic_title: str
    score: int
    total_questions: int

class AssessmentCreateResponse(BaseModel):
    assessment_id: int
    child_id: int
    lesson_id: Optional[int] = None
    topic_title: str
    score: int
    total_questions: int
    created_at: datetime

class HistoryItem(BaseModel):
    item_type: str
    title: str
    subtitle: str
    created_at: datetime
    lesson_id: Optional[int] = None

class ProfileStatsResponse(BaseModel):
    child_id: int
    child_name: str
    child_age: Optional[int] = None
    daily_time_limit: Optional[int] = None
    member_since: Optional[datetime] = None
    time_spent_today_minutes: float
    quizzes_completed: int
    average_score_percentage: float

class ChildProfileUpdateRequest(BaseModel):
    child_name: Optional[str] = None
    child_age: Optional[int] = None
    daily_time_limit: Optional[int] = None

class ChildProfileResponse(BaseModel):
    child_id: int
    child_name: str
    child_age: Optional[int] = None
    daily_time_limit: Optional[int] = None

class LessonDetailResponse(BaseModel):
    lesson_id: int
    title: str
    script: str
    display_script: str
    audio_url: Optional[str] = None

# ------------------- Auth endpoints -------------------
@router.post("/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    if not email or not request.password:
        raise HTTPException(400, "Email and password required")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "Email already registered")
    new_user = User(email=email, password_hash=_hash_password(request.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Account created", "user_id": new_user.user_id, "email": new_user.email,
            "fullName": _format_display_name(request.fullName, new_user.email)}

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not _verify_password(request.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = secrets.token_urlsafe(32)
    user.last_login = datetime.utcnow()
    db.commit()
    return {"access_token": token, "token_type": "bearer", "user_id": user.user_id,
            "email": user.email, "fullName": _format_display_name(None, user.email)}

# ------------------- Script / Audio / Video endpoints -------------------
@router.post("/generate-script", response_model=ScriptResponse)
async def generate_script(request: ScriptRequest, db: Session = Depends(get_db)):
    loop = asyncio.get_event_loop()
    try:
        prompt_check = age_guard.process_prompt(request.prompt_text)
        if prompt_check["status"] == "rejected":
            raise HTTPException(400, detail=f"Prompt rejected: {prompt_check['message']}")

        result = await loop.run_in_executor(executor, podcast_pipeline.generate_timed_script,
                                            request.prompt_text, request.target_duration_minutes)
        raw_script = result['script']
        chapters = result.get('chapters', [])

        script_check = age_guard.check_script(raw_script)
        if script_check.startswith("UNSAFE"):
            safe_prompt = age_guard.make_safe_prompt(request.prompt_text)
            result = await loop.run_in_executor(executor, podcast_pipeline.generate_timed_script,
                                                safe_prompt, request.target_duration_minutes)
            raw_script = result['script']
            chapters = result.get('chapters', [])

        display_script = clean_script_for_display(raw_script)
        word_count = result.get('word_count', 0)
        estimated_time = result.get('actual_duration_minutes', 0)
        duration_accuracy = result.get('duration_accuracy_minutes', 999)

        new_prompt = ContentPrompt(child_id=request.child_id, prompt_text=request.prompt_text,
                                   generated_topic=raw_script)
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)

        title = raw_script[:50] + "..." if len(raw_script) > 50 else raw_script
        chapters_json = json.dumps(chapters) if chapters else None
        new_lesson = VisualLesson(category_id=request.category_id, prompt_id=new_prompt.prompt_id,
                                  title=title, description=raw_script,
                                  duration_seconds=int(estimated_time * 60),
                                  difficulty_level=request.difficulty_level,
                                  chapters_json=chapters_json)
        db.add(new_lesson)
        db.commit()
        db.refresh(new_lesson)

        return ScriptResponse(script=raw_script, display_script=display_script,
                              word_count=word_count, estimated_speaking_time=estimated_time,
                              target_word_count=0, target_duration=request.target_duration_minutes,
                              duration_accuracy=duration_accuracy, prompt_id=new_prompt.prompt_id,
                              lesson_id=new_lesson.lesson_id, prompt_modified=False,
                              safety_message=None)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, detail=f"Script generation failed: {str(e)}")
    finally:
        db.close()

@router.post("/generate-audio", response_model=AudioResponse)
async def generate_audio(request: AudioRequest, db: Session = Depends(get_db)):
    loop = asyncio.get_event_loop()
    try:
        pause_positions = await loop.run_in_executor(executor, audio_generator.generate,
                                                     request.script_text, request.audio_filename)
        audio_path = os.path.join("Audio", f"{request.audio_filename}.wav")
        pause_file = os.path.join("Audio", f"{request.audio_filename}_pauses.txt")
        audio_url = f"/audio/{request.audio_filename}.wav"

        lesson = db.query(VisualLesson).filter(VisualLesson.lesson_id == request.lesson_id).first()
        if lesson:
            lesson.narration = audio_path
            lesson.pause_positions_json = json.dumps(pause_positions)
            db.commit()

        return AudioResponse(pause_positions=pause_positions, audio_path=audio_path,
                             audio_url=audio_url, pause_file=pause_file, lesson_id=request.lesson_id)
    except Exception as e:
        import traceback
        print("="*50, "ERROR in /generate-audio:", traceback.format_exc(), "="*50)
        db.rollback()
        raise HTTPException(500, detail=f"Audio generation failed: {str(e)}")
    finally:
        db.close()

@router.post("/generate-video", response_model=VideoResponse)
async def generate_video(request: VideoRequest, db: Session = Depends(get_db)):
    loop = asyncio.get_event_loop()
    try:
        lesson = db.query(VisualLesson).filter(VisualLesson.lesson_id == request.lesson_id).first()
        if not lesson:
            raise HTTPException(404, "Lesson not found")
        if not lesson.chapters_json or not lesson.narration or not lesson.pause_positions_json:
            raise HTTPException(400, "Missing chapters, audio, or pause positions")

        chapters = json.loads(lesson.chapters_json)
        pause_positions = json.loads(lesson.pause_positions_json)

        audio_full_path = os.path.join(os.path.dirname(__file__), lesson.narration)
        if not os.path.exists(audio_full_path):
            alt = os.path.join(os.getcwd(), lesson.narration)
            if os.path.exists(alt):
                audio_full_path = alt
            else:
                raise HTTPException(500, "Audio file not found")

        project_name = request.project_name or f"lesson_{request.lesson_id}"
        video_gen = VideoGenerator(chapters=chapters, audio_path=audio_full_path,
                                   pause_positions_ms=pause_positions, project_name=project_name,
                                   output_dir="video", colab_url=os.getenv("COLAB_API_URL"),
                                   steps=50, guidance=9.0,
                                   negative_prompt="blurry, low quality, distorted, text, watermark, ugly, deformed, extra limbs, extra fingers, mutated")
        video_path = await loop.run_in_executor(executor, video_gen.run)
        video_url = f"/video/{project_name}/{project_name}_video.mp4"
        return VideoResponse(video_url=video_url, video_path=video_path, lesson_id=request.lesson_id)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("="*50, "ERROR in /generate-video:", traceback.format_exc(), "="*50)
        raise HTTPException(500, detail=f"Video generation failed: {str(e)}")

# ------------------- Assessment & History -------------------
@router.post("/assessments", response_model=AssessmentCreateResponse)
async def create_assessment_result(request: AssessmentCreateRequest, db: Session = Depends(get_db)):
    try:
        child = db.query(ChildProfile).filter(ChildProfile.child_id == request.child_id).first()
        if not child:
            raise HTTPException(404, "Child profile not found")
        if request.total_questions <= 0:
            raise HTTPException(400, "total_questions must be > 0")
        if request.score < 0 or request.score > request.total_questions:
            raise HTTPException(400, "Score out of range")
        if request.lesson_id:
            lesson = db.query(VisualLesson).filter(VisualLesson.lesson_id == request.lesson_id).first()
            if not lesson:
                raise HTTPException(404, "Lesson not found")

        new_result = AssessmentResult(child_id=request.child_id, lesson_id=request.lesson_id,
                                      topic_title=request.topic_title.strip() or "Untitled Topic",
                                      score=request.score, total_questions=request.total_questions)
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        return AssessmentCreateResponse(assessment_id=new_result.assessment_id,
                                        child_id=new_result.child_id, lesson_id=new_result.lesson_id,
                                        topic_title=new_result.topic_title, score=new_result.score,
                                        total_questions=new_result.total_questions,
                                        created_at=new_result.created_at)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, detail=f"Failed to save assessment: {str(e)}")

@router.get("/history/{child_id}", response_model=List[HistoryItem])
async def get_child_history(child_id: int, db: Session = Depends(get_db)):
    try:
        child = db.query(ChildProfile).filter(ChildProfile.child_id == child_id).first()
        if not child:
            raise HTTPException(404, "Child profile not found")

        # Lessons
        lessons = db.query(VisualLesson, ContentPrompt).join(ContentPrompt,
                    VisualLesson.prompt_id == ContentPrompt.prompt_id).filter(
                        ContentPrompt.child_id == child_id).all()
        items = []
        for lesson, prompt in lessons:
            topic = (prompt.prompt_text or lesson.title or "Untitled Topic").strip()
            items.append(HistoryItem(item_type="lesson", title=topic,
                                     subtitle="Topic learned", created_at=lesson.created_at,
                                     lesson_id=lesson.lesson_id))

        # Assessments
        assessments = db.query(AssessmentResult).filter(AssessmentResult.child_id == child_id).all()
        for res in assessments:
            items.append(HistoryItem(item_type="assessment", title=res.topic_title,
                                     subtitle=f"Assessment score: {res.score}/{res.total_questions}",
                                     created_at=res.created_at, lesson_id=res.lesson_id))

        items.sort(key=lambda x: x.created_at, reverse=True)
        return items
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to load history: {str(e)}")

@router.get("/lesson/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(VisualLesson).filter(VisualLesson.lesson_id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    prompt = db.query(ContentPrompt).filter(ContentPrompt.prompt_id == lesson.prompt_id).first()
    title = (prompt.prompt_text if prompt and prompt.prompt_text else None) or lesson.title or "Untitled Lesson"

    audio_url = f"/audio/{os.path.basename(lesson.narration)}" if lesson.narration else None

    return LessonDetailResponse(
        lesson_id=lesson.lesson_id,
        title=title.strip(),
        script=lesson.description or "",
        display_script=clean_script_for_display(lesson.description or ""),
        audio_url=audio_url,
    )

@router.get("/profile-stats/{child_id}", response_model=ProfileStatsResponse)
async def get_profile_stats(child_id: int, db: Session = Depends(get_db)):
    child = db.query(ChildProfile).filter(ChildProfile.child_id == child_id).first()
    if not child:
        raise HTTPException(404, "Child profile not found")

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_duration_seconds = db.query(func.coalesce(func.sum(VisualLesson.duration_seconds), 0)).join(
        ContentPrompt, VisualLesson.prompt_id == ContentPrompt.prompt_id
    ).filter(
        ContentPrompt.child_id == child_id,
        VisualLesson.created_at >= today_start,
    ).scalar()

    quizzes_completed, avg_score = db.query(
        func.count(QuizAttempt.attempt_id),
        func.coalesce(func.avg(QuizAttempt.percentage), 0),
    ).filter(QuizAttempt.child_id == child_id).first()

    return ProfileStatsResponse(
        child_id=child.child_id,
        child_name=child.child_name or "Learner",
        child_age=child.child_age,
        daily_time_limit=child.daily_time_limit,
        member_since=child.created_at,
        time_spent_today_minutes=round((today_duration_seconds or 0) / 60, 1),
        quizzes_completed=quizzes_completed or 0,
        average_score_percentage=round(float(avg_score or 0), 1),
    )

@router.patch("/child-profile/{child_id}", response_model=ChildProfileResponse)
async def update_child_profile(child_id: int, request: ChildProfileUpdateRequest, db: Session = Depends(get_db)):
    child = db.query(ChildProfile).filter(ChildProfile.child_id == child_id).first()
    if not child:
        raise HTTPException(404, "Child profile not found")

    if request.child_name is not None:
        name = request.child_name.strip()
        if not name:
            raise HTTPException(400, "child_name cannot be empty")
        child.child_name = name
    if request.child_age is not None:
        if request.child_age < 0 or request.child_age > 18:
            raise HTTPException(400, "child_age must be between 0 and 18")
        child.child_age = request.child_age
    if request.daily_time_limit is not None:
        if request.daily_time_limit < 0:
            raise HTTPException(400, "daily_time_limit cannot be negative")
        child.daily_time_limit = request.daily_time_limit

    db.commit()
    db.refresh(child)

    return ChildProfileResponse(
        child_id=child.child_id,
        child_name=child.child_name or "Learner",
        child_age=child.child_age,
        daily_time_limit=child.daily_time_limit,
    )