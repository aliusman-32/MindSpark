from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

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

Base.metadata.create_all(bind=engine)

os.makedirs("Audio", exist_ok=True)
app.mount("/audio", StaticFiles(directory="Audio"), name="audio")

os.makedirs("video", exist_ok=True)
app.mount("/video", StaticFiles(directory="video"), name="video")

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}