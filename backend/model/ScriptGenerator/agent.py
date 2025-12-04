from queryAgent import QueryAgent
from researchAgent import ResearchAgent
from chunkFactExtractor import ChunkFactExtractor
from docIndexer import DocIndexer
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
import os
from dotenv import load_dotenv

load_dotenv()


class PodcastAgent:
    def __init__(self):
        self.queryAgent = QueryAgent()

    def process(self, query: str):
        queries = self.queryAgent.process(query)
        print(queries)


def tavily_results_to_docs(results):
    docs = []
    for item in results:
        if item.get("content"):
            docs.append(
                Document(
                    page_content=item["content"],
                    metadata={
                        "source": item["url"],
                        "title": item["title"],
                        "score": item.get("score"),
                    },
                )
            )
    return docs


if __name__ == "__main__":
    query = "how does rocket start"
    agent = QueryAgent()
    researchAgent = ResearchAgent()
    docIndexer = DocIndexer()
    extractor = ChunkFactExtractor()

    result = agent.process(query)

    tavilyResults = []

    for query in result:
        research_result = researchAgent.process(query)
        tavilyResults.append(research_result)
        

    flat_results = [item for sublist in tavilyResults for item in sublist]
    docs = tavily_results_to_docs(flat_results)

    docIndexer.indexDocs(docs)

    relevant_chunks = docIndexer.retrieve("how does rocket start")
    fact_bank = extractor.process_chunks(relevant_chunks)
    for f in fact_bank:
        print(f)
