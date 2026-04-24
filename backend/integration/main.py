from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from api import router
from routers.quizzes import quiz_router
from database import Base, engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(quiz_router)

# Ensure database tables exist at startup
Base.metadata.create_all(bind=engine)

# Create Audio folder if it doesn't exist
os.makedirs("Audio", exist_ok=True)

# Serve static files from the Audio folder at the /audio URL path
app.mount("/audio", StaticFiles(directory="Audio"), name="audio")

# Create Video folder for generated videos
os.makedirs("video", exist_ok=True)
app.mount("/video", StaticFiles(directory="video"), name="video")

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}