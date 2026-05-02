import json
import os
import sys
import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

# Add project root to path so we can import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.model.QuizGenerate.QuizGenerator import QuizAgent
from database import get_db, VisualLesson, LessonQuiz, QuizAttempt
from sqlalchemy.orm import Session

quiz_router = APIRouter(tags=["quiz"])


def _normalize_text(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip()).lower()


def _ensure_chapters_from_lesson(lesson: VisualLesson):
    chapters = []
    if lesson.chapters_json:
        try:
            parsed = json.loads(lesson.chapters_json)
            if isinstance(parsed, list):
                chapters = parsed
        except Exception:
            chapters = []

    normalized = []
    for chapter in chapters:
        if not isinstance(chapter, dict):
            continue
        key_points = chapter.get("key_points", [])
        if isinstance(key_points, str):
            key_points = [key_points]
        normalized.append({
            "title": chapter.get("title", "Lesson"),
            "key_points": [str(point).strip() for point in key_points if str(point).strip()],
        })

    if normalized:
        return normalized

    # Fallback
    lesson_text = (lesson.description or lesson.title or "Lesson").strip()
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", lesson_text) if part.strip()]
    key_points = sentences[:5] if sentences else [lesson_text[:200]]
    return [{"title": lesson.title or "Lesson", "key_points": key_points}]


def _build_quiz_payload_from_lesson(lesson: VisualLesson):
    chapters = _ensure_chapters_from_lesson(lesson)
    # Create QuizAgent with chapters directly (no JSON file needed)
    quiz_agent = QuizAgent(chapters=chapters)
    quiz_questions = quiz_agent.build_quiz_from_chapters(chapters, max_questions=5)

    normalized_questions = []
    for index, question in enumerate(quiz_questions, start=1):
        question_type = question.get("question_type", "mcq")
        if question_type not in {"mcq", "true_false", "blank", "short"}:
            question_type = "mcq"
        normalized_questions.append({
            "question_id": str(index),
            "question_type": question_type,
            "question": question.get("question", ""),
            "correct_answer": question.get("correct_answer", ""),
            "wrong_options": question.get("wrong_options", []) or [],
        })

    return {"lesson_id": lesson.lesson_id, "questions": normalized_questions}


def _grade_answer(question: dict, selected_answer: Optional[str]):
    correct_answer = question.get("correct_answer")
    return _normalize_text(selected_answer) == _normalize_text(correct_answer)


def _quiz_dict_to_questions(quiz_dict: dict):
    questions = quiz_dict.get("questions") if isinstance(quiz_dict, dict) else None
    if questions:
        return questions

    questions = []
    if isinstance(quiz_dict, dict):
        for key in sorted(quiz_dict.keys(), key=lambda item: int(item) if str(item).isdigit() else str(item)):
            value = quiz_dict[key]
            if isinstance(value, dict):
                questions.append({
                    "question_id": str(key),
                    "question_type": value.get("question_type", "mcq"),
                    "question": value.get("question", ""),
                    "correct_answer": value.get("correct_answer", ""),
                    "wrong_options": value.get("wrong_options", []) or [],
                })
    return questions


# ------------------- Pydantic Models -------------------
class QuizGenerateRequest(BaseModel):
    lesson_id: int


class QuizQuestionResult(BaseModel):
    question_id: str
    question_type: str
    question: str
    selected_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool


class QuizSubmitRequest(BaseModel):
    lesson_id: int
    quiz_id: int
    user_id: Optional[int] = None
    child_id: Optional[int] = None
    answers: List[QuizQuestionResult]


# ------------------- Endpoints -------------------
@quiz_router.post("/generate-quiz")
async def generate_quiz(request: QuizGenerateRequest, db: Session = Depends(get_db)):
    lesson = db.query(VisualLesson).filter(VisualLesson.lesson_id == request.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    quiz_payload = _build_quiz_payload_from_lesson(lesson)
    saved_quiz = LessonQuiz(
        lesson_id=lesson.lesson_id,
        quiz_json=json.dumps(quiz_payload, ensure_ascii=False),
    )
    db.add(saved_quiz)
    db.commit()
    db.refresh(saved_quiz)

    return {
        "lesson_id": lesson.lesson_id,
        "lesson_title": lesson.title,
        "quiz_id": saved_quiz.quiz_id,
        "quiz": quiz_payload,
    }


@quiz_router.get("/quizzes")
async def list_quizzes(lesson_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(LessonQuiz).filter(LessonQuiz.lesson_id == lesson_id).order_by(LessonQuiz.created_at.desc()).all()
    return {
        "quizzes": [
            {
                "quiz_id": quiz.quiz_id,
                "lesson_id": quiz.lesson_id,
                "quiz": json.loads(quiz.quiz_json) if quiz.quiz_json else {},
                "created_at": quiz.created_at,
            }
            for quiz in quizzes
        ]
    }


@quiz_router.post("/quiz-attempts")
async def submit_quiz_attempt(request: QuizSubmitRequest, db: Session = Depends(get_db)):
    quiz = db.query(LessonQuiz).filter(LessonQuiz.quiz_id == request.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    stored_quiz = json.loads(quiz.quiz_json) if quiz.quiz_json else {}
    stored_questions = _quiz_dict_to_questions(stored_quiz)
    stored_by_id = {str(question.get("question_id")): question for question in stored_questions}

    graded_answers = []
    correct_count = 0
    for answer in request.answers:
        stored_question = stored_by_id.get(str(answer.question_id), {})
        question_payload = {
            "question_id": str(answer.question_id),
            "question_type": stored_question.get("question_type", answer.question_type),
            "question": stored_question.get("question", answer.question),
            "correct_answer": stored_question.get("correct_answer", answer.correct_answer),
        }
        is_correct = _grade_answer(question_payload, answer.selected_answer)
        if is_correct:
            correct_count += 1
        graded_answers.append({
            "question_id": str(answer.question_id),
            "question_type": question_payload["question_type"],
            "question": question_payload["question"],
            "selected_answer": answer.selected_answer,
            "correct_answer": question_payload["correct_answer"],
            "is_correct": is_correct,
        })

    total_questions = len(graded_answers)
    incorrect_count = total_questions - correct_count
    percentage = int(round((correct_count / total_questions) * 100)) if total_questions else 0

    attempt = QuizAttempt(
        quiz_id=quiz.quiz_id,
        lesson_id=request.lesson_id,
        user_id=request.user_id,
        child_id=request.child_id,
        score=correct_count,
        total_questions=total_questions,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        percentage=percentage,
        answers_json=json.dumps(graded_answers, ensure_ascii=False),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.attempt_id,
        "lesson_id": attempt.lesson_id,
        "quiz_id": attempt.quiz_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "correct_count": attempt.correct_count,
        "incorrect_count": attempt.incorrect_count,
        "percentage": attempt.percentage,
        "answers": graded_answers,
    }


@quiz_router.get("/quiz-attempts")
async def list_quiz_attempts(user_id: Optional[int] = None, lesson_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(QuizAttempt)
    if user_id is not None:
        query = query.filter(QuizAttempt.user_id == user_id)
    if lesson_id is not None:
        query = query.filter(QuizAttempt.lesson_id == lesson_id)
    attempts = query.order_by(QuizAttempt.created_at.desc()).all()
    return {
        "attempts": [
            {
                "attempt_id": attempt.attempt_id,
                "lesson_id": attempt.lesson_id,
                "quiz_id": attempt.quiz_id,
                "user_id": attempt.user_id,
                "child_id": attempt.child_id,
                "score": attempt.score,
                "total_questions": attempt.total_questions,
                "correct_count": attempt.correct_count,
                "incorrect_count": attempt.incorrect_count,
                "percentage": attempt.percentage,
                "answers": json.loads(attempt.answers_json) if attempt.answers_json else [],
                "created_at": attempt.created_at,
            }
            for attempt in attempts
        ]
    }