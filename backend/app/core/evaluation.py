"""
A lightweight, keyword-based retrieval evaluator. This is the kind of
instrumentation that separates a "toy RAG demo" from an engineered system:
every query run through /api/eval measures whether retrieval actually
surfaced relevant content, not just whether the LLM produced *an* answer.
"""
from typing import List, Dict, Any


def score_retrieval(retrieved_snippets: List[str], expected_keywords: List[str]) -> Dict[str, Any]:
    if not expected_keywords:
        return {"hit": None, "precision_at_k": None}

    keywords_lower = [k.lower() for k in expected_keywords]
    matched_chunks = 0
    any_hit = False

    for snippet in retrieved_snippets:
        snippet_lower = snippet.lower()
        if any(kw in snippet_lower for kw in keywords_lower):
            matched_chunks += 1
            any_hit = True

    precision = matched_chunks / len(retrieved_snippets) if retrieved_snippets else 0.0
    return {"hit": any_hit, "precision_at_k": round(precision, 3)}
