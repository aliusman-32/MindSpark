import json
import random
from shutil import copy
from langchain_google_genai import ChatGoogleGenerativeAI
import os 
import copy
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()


class SimplePromptTemplate:
    def __init__(self, template, input_variables=None):
        self.template = template
        self.input_variables = input_variables or []

    def format(self, **kwargs):
        # Ensure all required variables are provided
        for var in self.input_variables:
            if var not in kwargs:
                raise ValueError(f"Missing input variable: {var}")
        return self.template.format(**kwargs)

class QuizAgent:
    def __init__(self, json_path):
        self.data = self._load_json(json_path)
        self.chapters = self.data.get("chapters", [])

        # LLM agent (passed from outside for flexibility)
        self.llm = ChatGoogleGenerativeAI(api_key=os.getenv("GOOGLE_API_KEY"), model="gemini-2.5-flash")

        # MAIN agent prompt as SimplePromptTemplate
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

    # Generate a single question
    def generate_question(self, fact, qtype=None):
        if qtype is None:
            qtype = random.choice(["mcq", "true_false", "blank", "short"])

        # Format the prompt
        prompt_text = self.prompt.format(fact=fact, question_type=qtype)

        # Invoke LLM directly
        result = self.llm.invoke(prompt_text).content

        result = self.clean_json(result)

        # Convert LLM JSON output to Python dict
        return json.loads(result)
    
    def clean_json(self, text):
    # Remove markdown ```json … ```
        text = text.strip()

        if text.startswith("```"):
            # remove first ```xxx
            first_newline = text.find("\n")
            text = text[first_newline+1:]  # remove starting fence

        if text.endswith("```"):
            text = text[:-3]  # remove closing ```

        return text.strip()

    # Build full quiz
    def build_quiz(self):
        quiz = []
        for chapter in self.chapters:
            for fact in chapter.get("key_points", []):
                question = self.generate_question(fact)
                quiz.append(question)

        return quiz
    
    def save_quiz_unique(self, quiz_list):
        # Create folder
        quiz_dict = copy.deepcopy(quiz_list)
        folder = "Quizzes"
        os.makedirs(folder, exist_ok=True)
        # Unique name: quiz_2025-12-04_19-35-22.json
        filename = f"quiz_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.json"
        filepath = os.path.join(folder, filename)
        quiz_dict = {str(i+1): quiz_dict[i] for i in range(len(quiz_dict))}

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(quiz_dict, f, indent=4, ensure_ascii=False)

        return filepath
# ---------------------- RUN THE AGENT ----------------------
    
