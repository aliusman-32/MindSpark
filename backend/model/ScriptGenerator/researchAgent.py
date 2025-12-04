from langchain_tavily import TavilySearch
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()


class ResearchAgent:

    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        llm_api_key = os.getenv("GOOGLE_API_KEY")
        self.search = TavilySearch(
            api_key=api_key,
            llm_api_key=llm_api_key,
            topic="general",
            include_answer=True,
            include_raw_content=False,
            include_images=False,
        )

    def process(self, query):
        try:
            response = self.search.invoke(
                {
                    "query": query,
                    "search_depth": "advanced",
                }
            )
            result = response.get("results")
            return result

        except Exception as e:
            print(f"Error: {e}")
            raise ValueError("Sorry, there was an issue with the model.")
