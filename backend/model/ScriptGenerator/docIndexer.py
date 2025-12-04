
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from typing import List
import os
import pickle

INDEX_PATH = os.path.join(os.path.dirname(__file__), "../research_index")
INDEX_PATH = os.path.abspath(INDEX_PATH)
os.makedirs(INDEX_PATH, exist_ok=True)

# -------------------- Hybrid Retriever --------------------
class HybridRetriever:
    """Simple hybrid retriever combining dense and BM25 retrievers."""

    def __init__(self, retrievers: List, weights: List[float] = None):
        self.retrievers = retrievers
        self.weights = weights or [1.0] * len(retrievers)

    def get_relevant_documents(self, query: str) -> List[Document]:
        all_docs = []

        for retriever in self.retrievers:
            if hasattr(retriever, "invoke"):
                docs = retriever.invoke(query)
            elif hasattr(retriever, "get_relevant_documents"):
                docs = retriever.get_relevant_documents(query)
            else:
                docs = retriever._get_relevant_documents(query)

            all_docs.extend(docs)

        # Remove duplicates
        seen = set()
        unique_docs = []
        for doc in all_docs:
            if doc.page_content not in seen:
                seen.add(doc.page_content)
                unique_docs.append(doc)
        return unique_docs

# -------------------- DocIndexer --------------------
class DocIndexer:
    def __init__(self, model_name="sentence-transformers/all-MiniLM-L6-v2"):
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
            keep_separator=True,
            add_start_index=True,
        )

        self.dense_k = 10
        self.bm25_k = 10
        self.similarity_threshold = 0.7
        self.dense_weight = 0.7
        self.sparse_weight = 0.3

        self.hybrid_retriever = None
        self._load_retrievers()

    def _load_retrievers(self):
        os.makedirs(INDEX_PATH, exist_ok=True)

        # --- FAISS index ---
        index_faiss_path = os.path.join(INDEX_PATH, "index.faiss")
        index_pkl_path = os.path.join(INDEX_PATH, "index.pkl")

        try:
            if os.path.exists(index_faiss_path) and os.path.exists(index_pkl_path):
                print("Loading existing FAISS index...")
                self.vectorstore = FAISS.load_local(
                    INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True
                )
            else:
                print("Creating new FAISS index...")
                dummy_text = "This is a dummy document to initialize the vector store"
                self.vectorstore = FAISS.from_texts([dummy_text], self.embeddings)
                self.vectorstore.save_local(INDEX_PATH)
        except Exception as e:
            print(f"Error loading FAISS index: {e}. Recreating...")
            if os.path.exists(index_faiss_path):
                os.remove(index_faiss_path)
            if os.path.exists(index_pkl_path):
                os.remove(index_pkl_path)
            dummy_text = "This is a dummy document to initialize the vector store"
            self.vectorstore = FAISS.from_texts([dummy_text], self.embeddings)
            self.vectorstore.save_local(INDEX_PATH)

        # --- Dense retriever ---
        dense_retriever = self.vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": self.dense_k,
                "lambda_mult": 0.7,
                "score_threshold": self.similarity_threshold,
            },
        )

        # --- BM25 retriever ---
        chunks_path = os.path.join(INDEX_PATH, "chunks.pkl")
        try:
            if os.path.exists(chunks_path):
                with open(chunks_path, "rb") as f:
                    chunks = pickle.load(f)
            else:
                chunks = [Document(page_content="Dummy content for BM25")]
                with open(chunks_path, "wb") as f:
                    pickle.dump(chunks, f)
        except Exception as e:
            print(f"Error loading chunks: {e}")
            chunks = [Document(page_content="Dummy content for BM25")]
            with open(chunks_path, "wb") as f:
                pickle.dump(chunks, f)

        bm25_retriever = BM25Retriever.from_documents(chunks)
        bm25_retriever.k = self.bm25_k

        # --- Hybrid retriever ---
        self.hybrid_retriever = HybridRetriever(
            retrievers=[dense_retriever, bm25_retriever],
            weights=[self.dense_weight, self.sparse_weight],
        )

        print("Retrievers loaded.")

    def indexDocs(self, docs):
        if not self.hybrid_retriever:
            self._load_retrievers()

        new_chunks = self.splitter.split_documents(docs)

        # --- Update FAISS index ---
        index_faiss_path = os.path.join(INDEX_PATH, "index.faiss")
        if os.path.exists(index_faiss_path):
            existing_vs = FAISS.load_local(
                INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True
            )
            existing_vs.add_documents(new_chunks)
            existing_vs.save_local(INDEX_PATH)
        else:
            new_vs = FAISS.from_documents(new_chunks, self.embeddings)
            new_vs.save_local(INDEX_PATH)

        # --- Update BM25 chunks ---
        chunks_path = os.path.join(INDEX_PATH, "chunks.pkl")
        if os.path.exists(chunks_path):
            with open(chunks_path, "rb") as f:
                existing_chunks = pickle.load(f)
        else:
            existing_chunks = []

        all_chunks = existing_chunks + new_chunks
        with open(chunks_path, "wb") as f:
            pickle.dump(all_chunks, f)

        self._load_retrievers()
        print("Documents indexed successfully.")

    def retrieve(self, query):
        if not self.hybrid_retriever:
            self._load_retrievers()
        return self.hybrid_retriever.get_relevant_documents(query)
