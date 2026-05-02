import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

DB_HOST = os.getenv("DB_HOST", "sql.freedb.tech")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "freedb_mindspark")
DB_USER = os.getenv("DB_USER", "freedb_mindspark")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "connect_timeout": 10,
        "read_timeout": 400,
        "write_timeout": 60
    },
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    pin_code = Column(Integer, nullable=True)
    email = Column(String(255))
    password_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime)
    is_active = Column(Integer, default=1)

    children = relationship("ChildProfile", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")

class ChildProfile(Base):
    __tablename__ = "child_profiles"
    child_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"))
    child_name = Column(String(255))
    child_age = Column(Integer)
    avatar_url = Column(String(255))
    daily_time_limit = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Integer, default=1)

    user = relationship("User", back_populates="children")
    prompts = relationship("ContentPrompt", back_populates="child")
    quiz_attempts = relationship("QuizAttempt", back_populates="child")

class Category(Base):
    __tablename__ = "categories"
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(255))
    description = Column(Text)
    icon_url = Column(String(255))

    lessons = relationship("VisualLesson", back_populates="category")

class ContentPrompt(Base):
    __tablename__ = "content_prompts"
    prompt_id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("child_profiles.child_id", ondelete="CASCADE", onupdate="CASCADE"))
    prompt_text = Column(Text)
    generated_topic = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    child = relationship("ChildProfile", back_populates="prompts")
    lesson = relationship("VisualLesson", back_populates="prompt", uselist=False)

class VisualLesson(Base):
    __tablename__ = "visual_lessons"
    lesson_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="CASCADE", onupdate="CASCADE"))
    prompt_id = Column(Integer, ForeignKey("content_prompts.prompt_id", ondelete="CASCADE", onupdate="CASCADE"))
    title = Column(String(255))
    description = Column(Text)
    visual_url = Column(String(255))
    thumbnail_url = Column(String(255))
    narration = Column(String(255))
    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    difficulty_level = Column(String(50))
    chapters_json = Column(Text, nullable=True)
    pause_positions_json = Column(Text, nullable=True)

    category = relationship("Category", back_populates="lessons")
    prompt = relationship("ContentPrompt", back_populates="lesson")
    quizzes = relationship("LessonQuiz", back_populates="lesson")

class LessonQuiz(Base):
    __tablename__ = "lesson_quizzes"
    quiz_id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("visual_lessons.lesson_id", ondelete="CASCADE", onupdate="CASCADE"))
    quiz_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lesson = relationship("VisualLesson", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    attempt_id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("lesson_quizzes.quiz_id", ondelete="CASCADE", onupdate="CASCADE"))
    lesson_id = Column(Integer, ForeignKey("visual_lessons.lesson_id", ondelete="CASCADE", onupdate="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    child_id = Column(Integer, ForeignKey("child_profiles.child_id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    percentage = Column(Integer, default=0)
    answers_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    quiz = relationship("LessonQuiz", back_populates="attempts")
    lesson = relationship("VisualLesson")
    user = relationship("User", back_populates="quiz_attempts")
    child = relationship("ChildProfile", back_populates="quiz_attempts")

class AssessmentResult(Base):
    __tablename__ = "assessment_results"
    assessment_id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("child_profiles.child_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("visual_lessons.lesson_id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True, index=True)
    topic_title = Column(String(255), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()