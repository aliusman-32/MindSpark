<div align="center">

# 🧠 MindSpark

### *AI-Powered Podcast Script & Audio Generation*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python_3.11-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)](https://python.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> MindSpark is an AI-powered content generation tool that creates podcast scripts and audio using Google's **Gemini API**, **Tavily** for web research, **Groq** for fast fact extraction, and various audio models.

</div>

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔍 **Research-Driven Scripts** | Uses Tavily to search the web, Groq to extract key facts, and Gemini to generate well-structured podcast scripts with natural pauses and SFX cues |
| 🎙️ **Audio Generation** | Converts scripts to speech using **Kokoro TTS**, generates sound effects via **AudioLDM**, then mixes them into a final audio file |
| 🖼️ **Visual Generation** | Generates contextual visuals and illustrations from script content using **Stable Diffusion** |
| 🧩 **Quiz Generation** | Automatically generates quizzes from lesson content to reinforce learning and test comprehension |
| 🗄️ **Database Storage** | Generated scripts and audio paths are stored in a **MySQL** database for retrieval and tracking |

---

## 🗂️ Project Structure

```
MindSpark/
├── backend/
│   ├── integration/          # API endpoints and database integration
│   │   ├── api.py            # FastAPI routes
│   │   ├── database.py       # SQLAlchemy models and connection
│   │   ├── main.py           # FastAPI app with CORS and static files
│   │   └── Audio/            # Generated audio files
│   ├── model/                # ScriptGenerator and AudioGenerator models
│   │   ├── ScriptGenerator/  # Research pipeline (Tavily, Groq) + Gemini script gen
│   │   └── VoiceLab/         # Audio generation (TTS + SFX)
│   └── ...
├── frontend/                 # React frontend (Vite)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── ...
├── .env                      # Environment variables (not committed)
├── .gitignore
├── requirements.txt          # Python dependencies
└── README.md
```

---

## 🛠️ Prerequisites

Before you begin, make sure you have the following:

- 🐍 **Python 3.11**
- 🟢 **Node.js** and **npm**
- 🔧 **Git**
- ☁️ A **Google Cloud** account with the Generative Language API enabled (Gemini)
- 🔑 A **Tavily** API key — [free tier at tavily.com](https://tavily.com/)
- ⚡ A **Groq** API key — [free tier at console.groq.com](https://console.groq.com/)
- 🗄️ A **MySQL** database (local or cloud, e.g., [freedb.tech](https://freedb.tech/))

---

## 🚀 Setup Instructions

### 🔧 Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/aliusman-32/MindSpark.git
cd MindSpark
```

**2. Create and activate a virtual environment with Python 3.11**
```bash
python -m venv venv311

# Windows
source venv311/Scripts/activate

# Mac/Linux
source venv311/bin/activate
```

**3. Install Python dependencies**
```bash
pip install -r requirements.txt
```

**4. Create a `.env` file in the root directory**
```env
GOOGLE_API_KEY=your_google_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
GROQ_API_KEY=your_groq_api_key_here
DB_HOST=your_database_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

**5. Start the backend server**
```bash
cd backend/integration
uvicorn main:app --reload
```

> 📡 API available at **http://localhost:8000**
> 📖 Interactive docs at **http://localhost:8000/docs**

---

### 🎨 Frontend Setup

**1. Navigate to the frontend folder**
```bash
cd frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

> 🌐 App available at **http://localhost:5173**

---

## 📡 API Endpoints

### `POST /generate-script`
Generates a podcast script based on the provided topic and target duration.

**Request Body:**
```json
{
  "child_id": 1,
  "prompt_text": "Tell me about the solar system",
  "target_duration_minutes": 5.0,
  "category_id": 1,
  "difficulty_level": "beginner"
}
```

**Response:** Returns the generated script, word count, estimated speaking time, duration accuracy, and the database IDs of the created prompt and lesson.

---

### `POST /generate-audio`
Generates audio from a script, including narration and sound effects.

**Request Body:**
```json
{
  "child_id": 1,
  "lesson_id": 11,
  "script_text": "The generated script...",
  "audio_filename": "lesson_11"
}
```

**Response:** Returns the audio URL and pause timestamps.

---

## 🧰 Technologies Used

### Backend
| Tool | Purpose |
|------|---------|
| ⚡ **FastAPI** | REST API framework |
| 🔗 **SQLAlchemy + PyMySQL** | ORM and database connection |
| 🤖 **Google Gemini API** | Script generation |
| 🔍 **Tavily API** | Web research |
| ⚡ **Groq API** | Fast fact extraction |
| 🗣️ **Kokoro TTS** | Text-to-speech narration |
| 🎵 **AudioLDM (Diffusers)** | AI sound effect generation |
| 🖼️ **Stable Diffusion** | AI visual generation |
| 🔗 **LangChain + FAISS + BM25** | Retrieval and search pipeline |

### Frontend
| Tool | Purpose |
|------|---------|
| ⚛️ **React + Vite** | UI framework and build tool |
| 🎨 **Tailwind CSS** | Styling |

### Database
| Tool | Purpose |
|------|---------|
| 🗄️ **MySQL** (freedb.tech) | Persistent storage |

---

## 👥 Contributors

| Name | Role |
|------|------|
| 👩‍💻 **Aliza Akram** | Integration, API development, database schema & connection, UX design, poster, deployment |
| 🧠 **Ali Usman** | Script generator, audio generator models, quiz generator model, LLM classifier, Visual Generation, synchronization|
| 📝 **Muhammad Baig** | Documentation, agent prompt engineering,model optimization, data cleaning & testing |
| 🎨 **Muhammad Hassaan Karamat** | Frontend development (React, UI) |

---

<div align="center">

Made with ❤️ by the MindSpark Team

</div>
