"""
A small but real tool-calling agent loop: the LLM decides whether to call
`retrieve_documents`, `calculator`, or answer directly, and we execute
whichever tool it names, feed the result back, and let it continue until
it produces a final text answer. Every step is recorded into a trace so
the UI can render exactly what the agent did (this is the project's
signature feature).
"""
import time
from typing import List, Dict, Any

from app.core import vectorstore
from app.core.llm_client import generate_with_tools

AGENT_SYSTEM_PROMPT = """You are RAGForge's assistant. You have access to the user's uploaded
documents through the retrieve_documents tool, and a calculator tool for numeric questions.
Always call retrieve_documents before answering questions that could be grounded in the user's
documents. Cite specific facts only if they come from a retrieved chunk. If nothing relevant is
retrieved, say so plainly instead of guessing. Keep answers concise and well-structured."""

TOOLS = [
    {
        "name": "retrieve_documents",
        "description": "Search the user's uploaded documents for passages relevant to a query. "
                        "Returns the most relevant chunks with their source filename and a relevance score.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "calculator",
        "description": "Evaluate a basic arithmetic expression, e.g. for cost or percentage questions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "expression": {"type": "string", "description": "A Python-evaluable arithmetic expression."},
            },
            "required": ["expression"],
        },
    },
]


def _safe_eval(expr: str) -> str:
    allowed = set("0123456789+-*/(). ")
    if not set(expr) <= allowed:
        return "error: expression contains disallowed characters"
    try:
        return str(eval(expr, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"error: {e}"


def run_agent(owner_id: int, question: str, max_turns: int = 4) -> Dict[str, Any]:
    trace: List[Dict[str, Any]] = []
    citations: List[Dict[str, Any]] = []
    messages = [{"role": "user", "content": question}]

    for _ in range(max_turns):
        t0 = time.time()
        resp = generate_with_tools(AGENT_SYSTEM_PROMPT, messages, TOOLS)
        turn_ms = (time.time() - t0) * 1000

        if not resp.tool_calls:
            trace.append({"step": "final_answer", "detail": "Model answered directly.", "duration_ms": round(turn_ms, 1)})
            return {"answer": resp.text, "citations": citations, "trace": trace}

        # Anthropic requires the assistant turn (with tool_use blocks) echoed back;
        # to keep the provider-agnostic client simple we just replay tool results as
        # plain user turns describing what was found, which both providers accept.
        tool_summaries = []
        for call in resp.tool_calls:
            t1 = time.time()
            if call["name"] == "retrieve_documents":
                query = call["input"]["query"]
                hits = vectorstore.search(owner_id, query)
                for h in hits:
                    citations.append(h)
                summary = "\n".join(f"[{h['filename']}#{h['chunk_index']}] {h['snippet'][:200]}" for h in hits) or "No relevant passages found."
                tool_summaries.append(f"retrieve_documents('{query}') found {len(hits)} passage(s):\n{summary}")
                trace.append({
                    "step": "retrieve_documents",
                    "detail": f"query='{query}' -> {len(hits)} chunk(s) retrieved",
                    "duration_ms": round((time.time() - t1) * 1000, 1),
                })
            elif call["name"] == "calculator":
                expr = call["input"]["expression"]
                result = _safe_eval(expr)
                tool_summaries.append(f"calculator('{expr}') = {result}")
                trace.append({
                    "step": "calculator",
                    "detail": f"{expr} = {result}",
                    "duration_ms": round((time.time() - t1) * 1000, 1),
                })
            else:
                tool_summaries.append(f"Unknown tool: {call['name']}")

        messages.append({"role": "assistant", "content": resp.text or "(calling tools)"})
        messages.append({"role": "user", "content": "Tool results:\n" + "\n\n".join(tool_summaries) + "\n\nNow answer the original question using these results."})

    trace.append({"step": "max_turns_reached", "detail": "Agent stopped after reaching the turn limit.", "duration_ms": 0})
    return {"answer": resp.text or "I wasn't able to reach a final answer in time.", "citations": citations, "trace": trace}
