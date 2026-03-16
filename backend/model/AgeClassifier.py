import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

class AgeContentGuard:
    def __init__(self):
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model = genai.GenerativeModel("gemini-2.5-flash")
        self.age_range = "5-15 years"

    def _ask_llm(self, prompt):
        response = self.model.generate_content(prompt)
        return response.text.strip()

    def check_prompt(self, user_prompt):
        prompt = f"""
        You are a strict child safety moderator.
        Target age: {self.age_range}
        Check if the prompt below is appropriate.
        Content NOT allowed:
        - Violence
        - Killing
        - Horror / disturbing themes
        - Sexual content
        - Drugs / alcohol
        - Abusive language
        Reply ONLY in this format:
        SAFE
        or
        UNSAFE: reason
        Prompt:
        {user_prompt}
        """
        return self._ask_llm(prompt)

    def check_script(self, script):
        prompt = f"""
        Evaluate if the following script is suitable
        for children aged {self.age_range}.
        Disallowed themes:
        - violence
        - horror
        - sexual content
        - drugs
        - disturbing content
        Reply ONLY:
        SAFE
        or
        UNSAFE: reason
        Script:
        {script}
        """
        return self._ask_llm(prompt)

    def make_safe_prompt(self, user_prompt):
        safe_instruction = f"""
        Create content suitable for children aged {self.age_range}.
        Rules:
        - Use simple language
        - Friendly and educational tone
        - No violence or scary themes
        - Positive and safe storytelling
        - Suitable for school learning
        User request:
        {user_prompt}
        """
        return safe_instruction

    def process_prompt(self, user_prompt):
        result = self.check_prompt(user_prompt)
        if result.startswith("UNSAFE"):
            return {"status": "rejected", "message": result}
        return {"status": "approved", "safe_prompt": user_prompt}