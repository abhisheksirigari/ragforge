"""Plain RAG path: retrieve top-k chunks, then ask the LLM to answer using only them."""
import time
from typing import Dict, Any

from app.core import vectorstore
from app.core.llm_client import generate

RAG_SYSTEM_PROMPT = """You are RAGForge's document assistant. Answer the user's question using ONLY
the provided context passages. Each passage is labeled with a source tag like [source:3]. When you
use a fact from a passage, reference its tag inline, e.g. "Revenue grew 12% [source:1]". If the
context does not contain enough information to answer, say so directly instead of guessing."""


def answer_question(owner_id: int, question: str) -> Dict[str, Any]:
    t0 = time.time()
    hits = vectorstore.search(owner_id, question)
    retrieval_ms = (time.time() - t0) * 1000

    if not hits:
        return {
            "answer": "I couldn't find anything relevant in your uploaded documents for this question. "
                      "Try uploading a document first, or rephrase your question.",
            "citations": [],
            "trace": [{"step": "retrieve_documents", "detail": "0 chunks retrieved", "duration_ms": round(retrieval_ms, 1)}],
        }

    context_block = "\n\n".join(
        f"[source:{i+1}] (from {h['filename']}, chunk {h['chunk_index']})\n{h['snippet']}"
        for i, h in enumerate(hits)
    )
    user_prompt = f"Context passages:\n\n{context_block}\n\nQuestion: {question}"

    t1 = time.time()
    answer_text = generate(RAG_SYSTEM_PROMPT, user_prompt)
    generation_ms = (time.time() - t1) * 1000

    trace = [
        {"step": "retrieve_documents", "detail": f"{len(hits)} chunk(s) retrieved", "duration_ms": round(retrieval_ms, 1)},
        {"step": "generate_answer", "detail": "LLM synthesized grounded answer", "duration_ms": round(generation_ms, 1)},
    ]

    return {"answer": answer_text, "citations": hits, "trace": trace}
