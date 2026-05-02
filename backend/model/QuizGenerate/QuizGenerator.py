import json
import random
import os
import copy
import time
from datetime import datetime
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


class SimplePromptTemplate:
    def __init__(self, template, input_variables=None):
        self.template = template
        self.input_variables = input_variables or []

    def format(self, **kwargs):
        for var in self.input_variables:
            if var not in kwargs:
                raise ValueError(f"Missing input variable: {var}")
        return self.template.format(**kwargs)


class QuizAgent:
    def __init__(self, json_path=None, chapters=None):
        """
        Initialize with either a JSON file path or a list of chapters.
        chapters: list of dicts with keys 'title' and 'key_points' (list of facts/points)
        """
        if json_path is not None:
            self.data = self._load_json(json_path)
            self.chapters = self.data.get("chapters", [])
        elif chapters is not None:
            self.chapters = chapters
        else:
            self.chapters = []

        # Use gemini-2.0-flash which is available and has higher free quotas
        self.llm = ChatGoogleGenerativeAI(
            api_key=os.getenv("GOOGLE_API_KEY"),
            model="gemini-2.0-flash"
        )

        self.prompt = SimplePromptTemplate(
            template=(
                "You are an expert quiz generation agent. "
                "Given the following fact:\n\n"
                "\"{fact}\"\n\n"
                "Generate a quiz question of type: {question_type}.\n\n"
                "Return ONLY valid JSON in this format:\n"
                "{{\n"
                '  "question_type": "mcq | true_false | blank | short",\n'
                '  "question": "...",\n'
                '  "correct_answer": "...",\n'
                '  "wrong_options": ["...", "...", "..."]   # only for MCQ\n'
                "}}\n\n"
                "RULES:\n"
                "- Always return a complete JSON object.\n"
                "- For MCQ: provide 1 correct and 3 wrong options.\n"
                "- For True/False: correct_answer must be true or false.\n"
                "- For Fill-in-the-Blank: remove a key word and return the removed word as correct_answer.\n"
                "- For Short Question: provide a 1–2 sentence answer.\n"
                "- No explanation. Only valid JSON.\n"
            ),
            input_variables=["fact", "question_type"]
        )

    def _load_json(self, path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def generate_question(self, fact, qtype=None):
        if qtype is None:
            qtype = random.choice(["mcq", "true_false", "blank", "short"])

        prompt_text = self.prompt.format(fact=fact, question_type=qtype)
        result = self.llm.invoke(prompt_text).content
        result = self._clean_json(result)
        return json.loads(result)

    def _clean_json(self, text):
        text = text.strip()
        if text.startswith("```"):
            first_newline = text.find("\n")
            text = text[first_newline+1:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    def build_quiz(self, max_questions=None):
        quiz = []
        all_facts = []
        for chapter in self.chapters:
            all_facts.extend(chapter.get("key_points", []))
        # Optionally limit number of questions
        if max_questions and max_questions < len(all_facts):
            all_facts = random.sample(all_facts, max_questions)
        for fact in all_facts:
            question = self.generate_question(fact)
            quiz.append(question)
            time.sleep(0.5)   # 500ms delay to respect rate limits
        return quiz

    def build_quiz_from_chapters(self, chapters, max_questions=None):
        """Convenience method to generate quiz directly from chapters list."""
        self.chapters = chapters
        return self.build_quiz(max_questions=max_questions)

    def save_quiz_unique(self, quiz_list):
        folder = "Quizzes"
        os.makedirs(folder, exist_ok=True)
        filename = f"quiz_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.json"
        filepath = os.path.join(folder, filename)
        quiz_dict = {str(i+1): quiz_list[i] for i in range(len(quiz_list))}
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(quiz_dict, f, indent=4, ensure_ascii=False)
        return filepath