"""
Thin wrapper around a persistent ChromaDB collection. One collection per
deployment, namespaced by owner_id in metadata so users only ever retrieve
their own documents even though the index is shared on disk.
"""
from typing import List, Dict, Any

import chromadb

from app.config import get_settings
from app.core.embeddings import embed_texts, embed_query

settings = get_settings()

_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
_collection = _client.get_or_create_collection(name="documents")


def add_chunks(
    owner_id: int,
    document_id: int,
    filename: str,
    chunks: List[str],
) -> None:
    if not chunks:
        return
    embeddings = embed_texts(chunks)
    ids = [f"doc{document_id}-chunk{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "owner_id": owner_id,
            "document_id": document_id,
            "filename": filename,
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]
    _collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)


def search(owner_id: int, query: str, top_k: int = None) -> List[Dict[str, Any]]:
    top_k = top_k or settings.top_k
    query_vec = embed_query(query)

    results = _collection.query(
        query_embeddings=[query_vec],
        n_results=top_k,
        where={"owner_id": owner_id},
    )

    hits = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(docs, metas, dists):
        # Chroma returns a distance; convert to a 0-1 similarity-ish score for display.
        score = max(0.0, 1.0 - dist)
        hits.append({
            "document_id": meta["document_id"],
            "filename": meta["filename"],
            "chunk_index": meta["chunk_index"],
            "snippet": doc,
            "score": round(score, 4),
        })
    return hits


def delete_document(document_id: int) -> None:
    _collection.delete(where={"document_id": document_id})
