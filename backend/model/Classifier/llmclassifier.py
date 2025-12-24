from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage  
import os
from dotenv import load_dotenv
load_dotenv()


class LLMClassifier:
    def __init__(self):
        self.chat_model = ChatGoogleGenerativeAI(
            api_key=os.getenv("GOOGLE_API_KEY"),
            model="gemini-2.5-flash" 
        )
        self.categories = ["History", "Science", "Math", "Language", "Others", "General Knowledge", "Geography", "Stories"]

    def classify_text(self, text):
        prompt = f"""
        You are a text classifier. Classify the following text into one of these categories:
        {', '.join(self.categories)}.
        Only respond with the category name.

        Text: \"\"\"{text}\"\"\"
        """

        response = self.chat_model.invoke([HumanMessage(content=prompt)])
        category = response.content.strip()
        return category


