"""
Embeddings, provider-agnostic like the LLM client.

Default provider is "gemini" — it calls Google's embedding API, which is
free and requires no extra local compute. This matters a lot for low-memory
deployments (e.g. Render's free 512MB tier): the alternative, "local"
sentence-transformers, pulls in PyTorch, which alone can use 400-600MB of
RAM once the model is loaded — enough to crash a free-tier instance outright.

Because of that, torch/sentence-transformers are imported lazily, only
inside the "local" branch, so a Gemini-only deployment never pays that
memory cost even though the packages may still be installed.
"""
from functools import lru_cache
from typing import List

from app.config import get_settings

settings = get_settings()

# Gemini's embedding API caps batch size; chunk larger requests to stay safe.
_GEMINI_BATCH_SIZE = 90


@lru_cache
def _get_local_embedder():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(settings.embedding_model)


def _embed_local(texts: List[str]) -> List[List[float]]:
    model = _get_local_embedder()
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return vectors.tolist()


def _embed_gemini(texts: List[str], task_type: str) -> List[List[float]]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)
    all_vectors: List[List[float]] = []

    for i in range(0, len(texts), _GEMINI_BATCH_SIZE):
        batch = texts[i:i + _GEMINI_BATCH_SIZE]
        response = client.models.embed_content(
            model=settings.gemini_embedding_model,
            contents=batch,
            config=types.EmbedContentConfig(task_type=task_type),
        )
        all_vectors.extend(e.values for e in response.embeddings)

    return all_vectors


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed document chunks at ingest time."""
    if not texts:
        return []
    if settings.embedding_provider == "local":
        return _embed_local(texts)
    return _embed_gemini(texts, task_type="RETRIEVAL_DOCUMENT")


def embed_query(query: str) -> List[float]:
    """Embed a user's search query — Gemini distinguishes query vs document
    embeddings via task_type for better retrieval quality."""
    if settings.embedding_provider == "local":
        return _embed_local([query])[0]
    return _embed_gemini([query], task_type="RETRIEVAL_QUERY")[0]
