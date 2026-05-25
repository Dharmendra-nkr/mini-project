"""
RAG Retriever for Grand Meridian Resort.

Exposes two functions:
  - initialise()      → called once at app startup to build the vector index
  - query_knowledge() → semantic search + context assembly for agent use
"""

import logging
from typing import Optional

from backend.rag.hotel_docs import get_all_documents
from backend.rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)

_INITIALISED = False


async def initialise() -> None:
    """
    Build (or load cached) vector embeddings for all hotel documents.
    Call this once during FastAPI startup.
    """
    global _INITIALISED
    if _INITIALISED:
        return

    logger.info("Initialising hotel knowledge vector store…")
    store = get_vector_store()
    docs = get_all_documents()
    store.build(docs)
    _INITIALISED = True
    logger.info(f"RAG initialised: {len(docs)} documents indexed.")


def query_knowledge(
    query: str,
    top_k: int = 4,
    category: Optional[str] = None,
    extra_queries: Optional[list[str]] = None,
) -> str:
    """
    Perform a semantic search over the hotel knowledge base and return
    a formatted context string ready to be injected into an LLM prompt.

    Args:
        query:         The guest's question or topic.
        top_k:         How many document chunks to retrieve.
        category:      Optional filter (e.g. 'dining', 'spa', 'activities').
        extra_queries: Additional query variants for multi-query expansion.

    Returns:
        A formatted string with the retrieved context, including titles
        and relevance scores. Returns empty string if store not initialised.
    """
    if not _INITIALISED:
        logger.warning("RAG not initialised — call initialise() at startup.")
        return ""

    store = get_vector_store()

    if extra_queries:
        results = store.search_multi_query([query] + extra_queries, top_k=top_k)
    else:
        results = store.search(query, top_k=top_k, category=category)

    if not results:
        return ""

    # Format context for prompt injection
    chunks = []
    for i, r in enumerate(results, 1):
        chunks.append(
            f"[Source {i}: {r['title']} | Category: {r['category']} | Relevance: {r['score']:.2f}]\n"
            f"{r['text']}"
        )

    context = "\n\n".join(chunks)
    return context


def get_top_docs(query: str, top_k: int = 3) -> list[dict]:
    """
    Return the raw top-k document dicts for a query.
    Useful for agents that want to do their own formatting.
    """
    if not _INITIALISED:
        return []
    store = get_vector_store()
    return store.search(query, top_k=top_k)


# ─────────────────────────────────────────
# Category helpers for the concierge agent
# ─────────────────────────────────────────

TOPIC_CATEGORY_MAP = {
    # Dining
    "restaurant": "dining",
    "food": "dining",
    "eat": "dining",
    "menu": "dining",
    "dinner": "dining",
    "breakfast": "dining",
    "lunch": "dining",
    "bistro": "dining",
    "bar": "dining",
    "brunch": "dining",
    "lounge": "dining",
    # Spa
    "spa": "spa",
    "massage": "spa",
    "treatment": "spa",
    "wellness": "spa",
    "yoga": "spa",
    "sauna": "spa",
    "facial": "spa",
    # Activities
    "activity": "activities",
    "activities": "activities",
    "sport": "activities",
    "diving": "activities",
    "surf": "activities",
    "kayak": "activities",
    "tour": "activities",
    "helicopter": "activities",
    "island": "activities",
    "fishing": "activities",
    "snorkel": "activities",
    # Rooms
    "room": "rooms",
    "suite": "rooms",
    "villa": "rooms",
    "penthouse": "rooms",
    "amenity": "rooms",
    "amenities": "rooms",
    # Policies
    "cancellation": "policies",
    "policy": "policies",
    "check-in": "policies",
    "checkout": "policies",
    "pet": "policies",
    "smoking": "policies",
    # Location
    "location": "location",
    "airport": "location",
    "transfer": "location",
    "transport": "location",
    "shuttle": "location",
    # Events
    "wedding": "events",
    "event": "events",
    "conference": "events",
    "ballroom": "events",
    # Kids
    "kids": "facilities",
    "children": "facilities",
    "baby": "facilities",
    "child": "facilities",
    # Sustainability
    "eco": "sustainability",
    "green": "sustainability",
    "environment": "sustainability",
    "sustainability": "sustainability",
    # Loyalty
    "loyalty": "loyalty",
    "reward": "loyalty",
    "points": "loyalty",
    "membership": "loyalty",
    # Health
    "medical": "health",
    "doctor": "health",
    "health": "health",
    "safety": "health",
    # Wings
    "wing": "wings",
    "coral": "wings",
    "horizon": "wings",
    "palm": "wings",
    "reef": "wings",
    # Overview
    "about": "overview",
    "award": "overview",
    "history": "overview",
}


def infer_category(topic: str) -> Optional[str]:
    """Heuristically infer a document category from a topic string."""
    topic_lower = topic.lower()
    for keyword, category in TOPIC_CATEGORY_MAP.items():
        if keyword in topic_lower:
            return category
    return None  # no filter — search across all categories
