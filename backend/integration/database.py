import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

# Read database credentials from environment variables
DB_HOST = os.getenv("DB_HOST", "sql.freedb.tech")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "freedb_mindspark")
DB_USER = os.getenv("DB_USER", "freedb_mindspark")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Construct the database URL for SQLAlchemy
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create the engine (the connection to the database)
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "connect_timeout": 10,        # seconds to wait for connection
        "read_timeout": 30,            # seconds to wait for query
        "write_timeout": 30
    },
    pool_pre_ping=True,                # test connections before using
    pool_recycle=300                    # recycle connections every 5 minutes
)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

# ------------------- Define Tables as Python Classes -------------------

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    pin_code = Column(Integer, nullable=True)
    email = Column(String(255))
    password_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime)
    is_active = Column(Integer, default=1)

    # Relationship to child profiles (one-to-many)
    children = relationship("ChildProfile", back_populates="user")

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
    generated_topic = Column(Text)   # We'll store the generated script here
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    child = relationship("ChildProfile", back_populates="prompts")
    lesson = relationship("VisualLesson", back_populates="prompt", uselist=False)  # one-to-one

class VisualLesson(Base):
    __tablename__ = "visual_lessons"
    lesson_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="CASCADE", onupdate="CASCADE"))
    prompt_id = Column(Integer, ForeignKey("content_prompts.prompt_id", ondelete="CASCADE", onupdate="CASCADE"))
    title = Column(String(255))
    description = Column(Text)                # full script
    visual_url = Column(String(255))
    thumbnail_url = Column(String(255))
    narration = Column(String(255))           # path to audio file
    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    difficulty_level = Column(String(50))

    # New columns for video generation
    chapters_json = Column(Text, nullable=True)        # JSON of chapters (title + key_points)
    pause_positions_json = Column(Text, nullable=True) # list of chapter start times in ms

    category = relationship("Category", back_populates="lessons")
    prompt = relationship("ContentPrompt", back_populates="lesson")

# ------------------- Helper function to get a database session -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()