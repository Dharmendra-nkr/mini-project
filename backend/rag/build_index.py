#!/usr/bin/env python3
"""
Pre-build Hotel Knowledge Base Embeddings
==========================================
Run this script ONCE before starting the server (or after updating hotel_docs.py)
to pre-compute and cache the vector embeddings.

Usage:
    cd /path/to/project
    python -m backend.rag.build_index

Or directly:
    python backend/rag/build_index.py

The script downloads the sentence-transformer model (~90 MB on first run)
and saves embeddings to backend/rag/cache/hotel_embeddings.npy

After this the server loads embeddings from cache in <1 second at startup.
If you skip this step, embeddings are computed automatically at first server
startup (adds ~10–30 seconds to first startup).
"""

import sys
import logging
import time
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("build_index")


def main():
    logger.info("=" * 60)
    logger.info("Grand Meridian Resort — Building Vector Index")
    logger.info("=" * 60)

    from backend.rag.hotel_docs import get_all_documents
    from backend.rag.vector_store import get_vector_store

    docs = get_all_documents()
    logger.info(f"Loaded {len(docs)} knowledge base documents.")

    store = get_vector_store()

    t0 = time.time()
    store.build(docs)
    elapsed = time.time() - t0

    logger.info(f"✅ Index built in {elapsed:.1f}s")
    logger.info("Embeddings cached to backend/rag/cache/")
    logger.info("")
    logger.info("Test a sample query:")

    results = store.search("What restaurants are available at the resort?", top_k=3)
    for r in results:
        logger.info(f"  [{r['score']:.3f}] {r['title']}")

    logger.info("")
    results2 = store.search("helicopter tour price", top_k=3)
    for r in results2:
        logger.info(f"  [{r['score']:.3f}] {r['title']}")

    logger.info("")
    logger.info("✅ Build complete. You can now start the server.")


if __name__ == "__main__":
    main()
