import os
import re
import json
from typing import List, Dict, Any
from groq import Groq
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()


def _trim_excerpt_to_words(excerpt: str) -> str:
    words = re.findall(r"\S+", excerpt or "")
    return " ".join(words).strip()

# check whatsapp and session chat

class ChunkFactExtractor:
    """
    Extract 1–2 concise facts per chunk using Groq (fast and cheap for bulk processing)
    """

    def __init__(self, temperature: float = 0.2):
        # Use Groq for fast fact extraction
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "openai/gpt-oss-20b"  # Fast model for bulk processing (llama-3.1-8b-instant was retired by Groq)

    def process_chunk(self, doc: Document) -> List[Dict[str, Any]]:
        meta = doc.metadata or {}
        source_title = meta.get("title") or ""
        source_url = meta.get("url") or meta.get("source") or ""
        chunk_id = meta.get("chunk_id") or meta.get("id") or ""

        chunk_text = doc.page_content.strip()

        prompt = f"""
You are a careful research assistant. Read the provided source chunk.
Extract up to 2 **concise, atomic facts** that are directly supported by the text.
For each fact, also include a **direct quoted excerpt** (<= 25 words) from the chunk.
Ensure facts are neutral and factual. If no suitable fact exists, return an empty list.

CHUNK START
{chunk_text}
CHUNK END

source_title: {source_title}
source_url: {source_url}
chunk_id: {chunk_id}

Return ONLY valid JSON in this exact format:
{{
  "facts": [
    {{
      "fact": "Concise factual statement",
      "excerpt": "Direct quote from chunk (<= 25 words)",
      "confidence": 0.8,
      "source_title": "{source_title}",
      "source_url": "{source_url}",
      "chunk_id": "{chunk_id}"
    }}
  ]
}}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a research assistant. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=800
            )

            result_text = response.choices[0].message.content.strip()
            
            # Clean up markdown formatting if present
            if result_text.startswith('```json'):
                result_text = result_text[7:-3]
            elif result_text.startswith('```'):
                result_text = result_text[3:-3]

            parsed = json.loads(result_text)
            facts_list = parsed.get("facts", [])
            
            cleaned_facts = []
            for f in facts_list:
                cleaned_facts.append({
                    "fact": f.get("fact", "").strip(),
                    "excerpt": f.get("excerpt", ""),
                    "confidence": float(f.get("confidence", 0.7)),
                    "source_title": f.get("source_title", source_title),
                    "source_url": f.get("source_url", source_url),
                    "chunk_id": f.get("chunk_id", chunk_id),
                })
            
            return cleaned_facts

        except Exception as e:
            print(f"[ChunkFactExtractor] Error processing chunk: {e}")
            return []

    def process_chunks(self, docs: List[Document]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for i, doc in enumerate(docs):
            try:
                print(f"Processing chunk {i+1}/{len(docs)} with Groq...")
                results.extend(self.process_chunk(doc))
            except Exception as e:
                print(f"[ChunkFactExtractor] Skipped chunk {i+1} due to error: {e}")
        return results