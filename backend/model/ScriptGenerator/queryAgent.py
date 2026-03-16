
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv

load_dotenv()


class QueryOutput(BaseModel):
    """Output schema for research queries"""
    query: List[str] = Field(
        description="A list of detailed and specific research search queries derived from the input prompt"
    )


class QueryAgent:
    def __init__(self):
        self.apiKey = os.getenv("GOOGLE_API_KEY")
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=self.apiKey, 
            temperature=0.7
        )

        self.outputParser = PydanticOutputParser(pydantic_object=QueryOutput)

        self.promptTemplate = PromptTemplate(
            template="""
            You are a research query generator.
            You will be given a basic user prompt.
            Your task is to produce a list of 4 **specific, detailed, and research-oriented search queries** 
            that will help Tavily gather enough information to write a long, detailed, and informative script.
            The user prompt is: {query}

            {format_instructions}
            """,
            input_variables=["query"],
            partial_variables={
                "format_instructions": self.outputParser.get_format_instructions()
            },
        )

    def process(self, query: str):
        try:
            chain = self.promptTemplate | self.llm
            response = chain.invoke({"query": query})

            answer = self.outputParser.parse(response.content)
            return answer.query  # Returns List[str] directly
        except Exception as e:
            print(f"Error: {e}")
            return ["Sorry, there was an issue with the model."]
