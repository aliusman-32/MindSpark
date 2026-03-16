\# MindSpark



MindSpark is an AI-powered content generation tool that creates podcast scripts and audio using Google's Gemini API, Tavily for web research, Groq for fast fact extraction, and various audio models. The project consists of a FastAPI backend and a React frontend, with a MySQL database for storing generated content.





\## Project Structure

MindSpark/

├── backend/

│ ├── integration/ # API endpoints and database integration

│ │ ├── api.py # FastAPI routes

│ │ ├── database.py # SQLAlchemy models and connection

│ │ ├── main.py # FastAPI app with CORS and static files

│ │ └── Audio/ # Generated audio files

│ ├── model/ # ScriptGenerator and AudioGenerator models

│ │ ├── ScriptGenerator/ # Research pipeline (Tavily, Groq) + Gemini-based script generation

│ │ └── VoiceLab/ # Audio generation (TTS + SFX)

│ └── ...

├── frontend/ # React frontend (Vite)

│ ├── src/ # Source files (moved from root)

│ ├── public/

│ ├── index.html

│ ├── package.json

│ └── ...

├── .env # Environment variables (not committed)

├── .gitignore # Git ignore file
├── requirements.txt # Python dependencies

└── README.md # This file





\## Features

\- \*\*Research‑Driven Script Generation:\*\* Enter a topic and desired duration; the backend uses Tavily to search the web, Groq to extract key facts, and Gemini to generate a well‑structured podcast script with natural pauses and SFX cues.

\- \*\*Audio Generation:\*\* The script is converted to speech using Kokoro TTS, and sound effects are generated using AudioLDM, then mixed into a final audio file.

\- \*\*Database Storage:\*\* Generated scripts and audio paths are stored in a MySQL database (e.g., freedb.tech) for later retrieval and tracking.





\## Prerequisites

\- Python 3.11

\- Node.js and npm

\- Git

**A Google Cloud account with the Generative Language API enabled (for Gemini)**

**- A Tavily API key (free tier available at \[tavily.com](https://tavily.com/))**

**- A Groq API key (free tier available at \[console.groq.com](https://console.groq.com/))**

**- A MySQL database (local or cloud, e.g., freedb.tech)**





\## Setup Instructions



\### Backend Setup



1\. Clone the repository:

   git clone https://github.com/aliusman-32/MindSpark.git

   cd MindSpark



2.Create and activate a virtual environment with Python 3.11:



python -m venv venv311

source venv311/Scripts/activate   # On Windows

\# On Mac/Linux: source venv311/bin/activate





3.Install Python dependencies:



pip install -r requirements.txt



4.Create a .env file in the root directory with the following variables:



GOOGLE\_API\_KEY=your\_google\_api\_key\_here

TAVILY\_API\_KEY=your\_tavily\_api\_key\_here

GROQ\_API\_KEY=your\_groq\_api\_key\_here

DB\_HOST=your\_database\_host

DB\_PORT=3306

DB\_NAME=your\_database\_name

DB\_USER=your\_database\_user

DB\_PASSWORD=your\_database\_password





5.Start the backend server:



cd backend/integration

uvicorn main:app --reload

The API will be available at http://localhost:8000. Interactive API documentation is at http://localhost:8000/docs.





Frontend Setup



1.Navigate to the frontend folder:



cd frontend



2.Install frontend dependencies:

npm install



3.Start the development server:



npm run dev



The app will open at http://localhost:5173 (or another port if specified).



API Endpoints

POST /generate-script

Generates a podcast script based on the provided chapters and target duration.



Request Body:



{

  "child\_id": 1,

  "prompt\_text": "Tell me about the solar system",

  "target\_duration\_minutes": 5.0,

  "category\_id": 1,

  "difficulty\_level": "beginner"

}



Response: Returns the generated script, word count, estimated speaking time, duration accuracy, and the database IDs of the created prompt and lesson.



POST /generate-audio

Generates audio from a script, including narration and sound effects.



Request Body:



{

  "child\_id": 1,

  "lesson\_id": 11,

  "script\_text": "The generated script...",

  "audio\_filename": "lesson\_11"

}



Response: Returns the audio URL and pause timestamps.



Technologies Used

Backend: FastAPI, SQLAlchemy, PyMySQL, Google Gemini API, Tavily API, Groq API, Kokoro TTS, Diffusers (AudioLDM), LangChain, FAISS, BM25



Frontend: React, Vite, Tailwind CSS



Database: MySQL (freedb.tech)



Contributors



Aliza - Integration, API development, database schema, database connection, designs (UX) , poster, deployment



Ali - Script generator, Audio generator models, Quiz Generator model, LLM Classifier, Synchronization Model



Baig - Documentation, Visual Generation, Agent's prompt Engineering Testing



Hassan - Frontend development (React, UI)

