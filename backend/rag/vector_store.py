"""
Vector Store for Grand Meridian Resort RAG.

Uses sentence-transformers to create embeddings and stores them
in-memory as numpy arrays for cosine similarity retrieval.
No external vector DB required — embeddings are computed once at
startup and cached to disk as a .npy file.

Optional Pinecone integration: set PINECONE_API_KEY in .env to
use Pinecone as the persistent vector store instead.
"""

import os
import json
import logging
import asyncio
import numpy as np
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────
_BASE_DIR = Path(__file__).resolve().parent
_CACHE_DIR = _BASE_DIR / "cache"
_EMBEDDINGS_FILE = _CACHE_DIR / "hotel_embeddings.npy"
_METADATA_FILE = _CACHE_DIR / "hotel_metadata.json"

# ──────────────────────────────────────────────────────────────
# Lazy singleton
# ──────────────────────────────────────────────────────────────
_store: Optional["LocalVectorStore"] = None


def cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Compute cosine similarity between one query vector and a matrix of vectors."""
    # query_vec: (dim,)  matrix: (n, dim)
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return np.zeros(matrix.shape[0])
    mat_norms = np.linalg.norm(matrix, axis=1)
    mat_norms[mat_norms == 0] = 1e-10  # avoid division by zero
    return (matrix @ query_vec) / (mat_norms * query_norm)


class LocalVectorStore:
    """
    In-process vector store backed by numpy arrays.
    Embeddings are computed using sentence-transformers and cached to disk.
    """

    def __init__(self):
        self._embeddings: Optional[np.ndarray] = None  # shape (N, dim)
        self._documents: list[dict] = []                # full docs (text + meta)
        self._model = None                              # sentence-transformer model

    def _get_model(self):
        """Lazy-load sentence-transformers model."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading sentence-transformers model: all-MiniLM-L6-v2")
                self._model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("Model loaded successfully.")
            except ImportError:
                raise RuntimeError(
                    "sentence-transformers not installed. "
                    "Run: pip install sentence-transformers"
                )
        return self._model

    def encode(self, texts: list[str]) -> np.ndarray:
        """Encode a list of strings to embedding vectors."""
        model = self._get_model()
        return model.encode(texts, convert_to_numpy=True, show_progress_bar=False)

    def build(self, documents: list[dict]) -> None:
        """
        Build the vector store from a list of documents.
        Each doc must have: id, category, title, text.
        Caches embeddings to disk.
        """
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)

        texts = [doc["text"] for doc in documents]

        # Check if cached embeddings exist and are the same size
        if _EMBEDDINGS_FILE.exists() and _METADATA_FILE.exists():
            try:
                cached_meta = json.loads(_METADATA_FILE.read_text())
                if len(cached_meta) == len(documents):
                    logger.info("Loading cached embeddings from disk.")
                    self._embeddings = np.load(str(_EMBEDDINGS_FILE))
                    self._documents = documents
                    logger.info(
                        f"Vector store ready: {len(documents)} docs, "
                        f"dim={self._embeddings.shape[1]}"
                    )
                    return
            except Exception as e:
                logger.warning(f"Cache load failed ({e}), rebuilding embeddings.")

        logger.info(f"Computing embeddings for {len(documents)} documents…")
        embeddings = self.encode(texts)
        self._embeddings = embeddings
        self._documents = documents

        # Cache to disk
        np.save(str(_EMBEDDINGS_FILE), embeddings)
        meta = [{"id": d["id"], "category": d["category"], "title": d["title"]}
                for d in documents]
        _METADATA_FILE.write_text(json.dumps(meta, indent=2))
        logger.info(
            f"Embeddings cached. Shape: {embeddings.shape}. "
            f"Files: {_EMBEDDINGS_FILE}"
        )

    def search(self, query: str, top_k: int = 5, category: str = None) -> list[dict]:
        """
        Semantic similarity search over the hotel knowledge base.

        Args:
            query:    Natural language question.
            top_k:    Number of top results to return.
            category: Optional filter — only return docs in this category.

        Returns:
            List of dicts with keys: id, category, title, text, score.
        """
        if self._embeddings is None or len(self._documents) == 0:
            logger.warning("Vector store is empty — call build() first.")
            return []

        query_vec = self.encode([query])[0]  # (dim,)
        scores = cosine_similarity(query_vec, self._embeddings)  # (N,)

        # Build (score, doc) pairs
        pairs = list(zip(scores.tolist(), self._documents))

        # Optional category filter
        if category:
            pairs = [(s, d) for s, d in pairs if d.get("category") == category]

        # Sort by score descending
        pairs.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, doc in pairs[:top_k]:
            results.append({
                "id": doc["id"],
                "category": doc["category"],
                "title": doc["title"],
                "text": doc["text"],
                "score": round(score, 4),
            })

        return results

    def search_multi_query(
        self, queries: list[str], top_k: int = 5
    ) -> list[dict]:
        """
        Search with multiple query variations and merge results.
        Useful for improving recall.
        """
        if not queries:
            return []

        query_vecs = self.encode(queries)  # (Q, dim)
        # Average the query vectors (multi-query expansion)
        avg_vec = query_vecs.mean(axis=0)

        scores = cosine_similarity(avg_vec, self._embeddings)
        pairs = sorted(
            zip(scores.tolist(), self._documents),
            key=lambda x: x[0],
            reverse=True,
        )
        seen_ids = set()
        results = []
        for score, doc in pairs:
            if doc["id"] not in seen_ids and len(results) < top_k:
                results.append({
                    "id": doc["id"],
                    "category": doc["category"],
                    "title": doc["title"],
                    "text": doc["text"],
                    "score": round(score, 4),
                })
                seen_ids.add(doc["id"])
        return results


# ──────────────────────────────────────────────────────────────
# Optional Pinecone backend
# ──────────────────────────────────────────────────────────────

class PineconeVectorStore:
    """
    Pinecone-backed vector store.
    Set PINECONE_API_KEY and PINECONE_INDEX_NAME in your .env to use this.
    Falls back to LocalVectorStore if Pinecone is unavailable.
    """

    def __init__(self, api_key: str, index_name: str = "grand-meridian"):
        self._api_key = api_key
        self._index_name = index_name
        self._index = None
        self._local = LocalVectorStore()  # kept for encoding

    def _get_index(self):
        if self._index is None:
            try:
                from pinecone import Pinecone
                pc = Pinecone(api_key=self._api_key)
                self._index = pc.Index(self._index_name)
                logger.info(f"Connected to Pinecone index: {self._index_name}")
            except ImportError:
                raise RuntimeError("pinecone-client not installed. Run: pip install pinecone-client")
        return self._index

    def build(self, documents: list[dict]) -> None:
        """Upsert all document embeddings to Pinecone."""
        self._local._get_model()  # ensure model is loaded
        index = self._get_index()
        texts = [d["text"] for d in documents]
        embeddings = self._local.encode(texts)

        vectors = []
        for doc, emb in zip(documents, embeddings):
            vectors.append({
                "id": doc["id"],
                "values": emb.tolist(),
                "metadata": {
                    "category": doc["category"],
                    "title": doc["title"],
                    "text": doc["text"][:1000],  # Pinecone metadata limit
                },
            })

        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            index.upsert(vectors=vectors[i:i + batch_size])
        logger.info(f"Upserted {len(vectors)} vectors to Pinecone index '{self._index_name}'.")

    def search(self, query: str, top_k: int = 5, category: str = None) -> list[dict]:
        """Query Pinecone for similar documents."""
        index = self._get_index()
        query_vec = self._local.encode([query])[0].tolist()

        filter_dict = {"category": {"$eq": category}} if category else None

        response = index.query(
            vector=query_vec,
            top_k=top_k,
            include_metadata=True,
            filter=filter_dict,
        )

        results = []
        for match in response.matches:
            results.append({
                "id": match.id,
                "category": match.metadata.get("category", ""),
                "title": match.metadata.get("title", ""),
                "text": match.metadata.get("text", ""),
                "score": round(match.score, 4),
            })
        return results

    def search_multi_query(self, queries: list[str], top_k: int = 5) -> list[dict]:
        """Multi-query search via Pinecone — average embeddings."""
        vecs = self._local.encode(queries)
        avg_vec = vecs.mean(axis=0).tolist()
        index = self._get_index()
        response = index.query(vector=avg_vec, top_k=top_k, include_metadata=True)
        results = []
        for match in response.matches:
            results.append({
                "id": match.id,
                "category": match.metadata.get("category", ""),
                "title": match.metadata.get("title", ""),
                "text": match.metadata.get("text", ""),
                "score": round(match.score, 4),
            })
        return results


# ──────────────────────────────────────────────────────────────
# Factory: returns whichever store is configured
# ──────────────────────────────────────────────────────────────

def get_vector_store() -> "LocalVectorStore | PineconeVectorStore":
    """
    Return the appropriate vector store.
    Uses Pinecone if PINECONE_API_KEY is set, otherwise local numpy store.
    """
    global _store
    if _store is not None:
        return _store

    pinecone_key = os.getenv("PINECONE_API_KEY", "")
    if pinecone_key:
        index_name = os.getenv("PINECONE_INDEX_NAME", "grand-meridian")
        logger.info(f"Using Pinecone vector store (index: {index_name})")
        _store = PineconeVectorStore(api_key=pinecone_key, index_name=index_name)
    else:
        logger.info("Using local numpy vector store (no Pinecone key found)")
        _store = LocalVectorStore()

    return _store
