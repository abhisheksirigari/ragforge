"""
Provider-agnostic LLM client. The rest of the app talks to `generate()` and
`generate_with_tools()` only — swapping LLM_PROVIDER in .env between
"anthropic", "openai", and "gemini" requires no other code changes.

Note on the Gemini SDK: this uses `google-genai` (the `from google import
genai` package), not the older `google-generativeai` package. Google
deprecated the latter in 2026 — it no longer receives updates, and some
newer models aren't available through it — so `google-genai` is the
supported client going forward.
"""
from typing import List, Dict, Any, Optional

from app.config import get_settings

settings = get_settings()


class LLMResponse:
    def __init__(self, text: str = "", tool_calls: Optional[List[Dict[str, Any]]] = None, raw: Any = None):
        self.text = text
        self.tool_calls = tool_calls or []
        self.raw = raw


def _anthropic_client():
    import anthropic
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _openai_client():
    import openai
    return openai.OpenAI(api_key=settings.openai_api_key)


def _gemini_client():
    from google import genai
    return genai.Client(api_key=settings.gemini_api_key)


def generate(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str:
    """Plain single-turn generation, used for the RAG answer synthesis step."""
    if settings.llm_provider == "anthropic":
        client = _anthropic_client()
        resp = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in resp.content if block.type == "text")

    if settings.llm_provider == "gemini":
        from google.genai import types
        client = _gemini_client()
        resp = client.models.generate_content(
            model=settings.gemini_model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=max_tokens,
            ),
        )
        return resp.text or ""

    client = _openai_client()
    resp = client.chat.completions.create(
        model=settings.openai_model,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content or ""


def generate_with_tools(
    system_prompt: str,
    messages: List[Dict[str, Any]],
    tools: List[Dict[str, Any]],
    max_tokens: int = 1024,
) -> LLMResponse:
    """
    One turn of a tool-calling loop. `tools` are provided in Anthropic's
    tool-schema shape; when the provider is OpenAI or Gemini we translate
    on the fly so callers (the agent loop) only need to write one schema.
    """
    if settings.llm_provider == "anthropic":
        client = _anthropic_client()
        resp = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages,
            tools=tools,
        )
        text = "".join(b.text for b in resp.content if b.type == "text")
        tool_calls = [
            {"id": b.id, "name": b.name, "input": b.input}
            for b in resp.content if b.type == "tool_use"
        ]
        return LLMResponse(text=text, tool_calls=tool_calls, raw=resp)

    if settings.llm_provider == "openai":
        client = _openai_client()
        oa_tools = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t["description"],
                    "parameters": t["input_schema"],
                },
            }
            for t in tools
        ]
        oa_messages = [{"role": "system", "content": system_prompt}] + messages
        resp = client.chat.completions.create(
            model=settings.openai_model,
            max_tokens=max_tokens,
            messages=oa_messages,
            tools=oa_tools,
        )
        choice = resp.choices[0].message
        tool_calls = []
        if choice.tool_calls:
            import json
            for tc in choice.tool_calls:
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "input": json.loads(tc.function.arguments or "{}"),
                })
        return LLMResponse(text=choice.content or "", tool_calls=tool_calls, raw=resp)

    # Gemini function-calling translation
    from google.genai import types
    client = _gemini_client()

    gemini_tools = [types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters=t["input_schema"],
        )
        for t in tools
    ])]

    # Our messages are always simple {"role": "user"/"assistant", "content": str}
    # turns (see agent.py), so translating to Gemini's user/model roles is a
    # straight map.
    contents = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages
    ]

    resp = client.models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=max_tokens,
            tools=gemini_tools,
        ),
    )

    text_parts = []
    tool_calls = []
    candidate = resp.candidates[0] if resp.candidates else None
    parts = candidate.content.parts if candidate and candidate.content else []
    for part in parts or []:
        if getattr(part, "text", None):
            text_parts.append(part.text)
        fc = getattr(part, "function_call", None)
        if fc and fc.name:
            tool_calls.append({"id": fc.name, "name": fc.name, "input": dict(fc.args or {})})

    return LLMResponse(text="".join(text_parts), tool_calls=tool_calls, raw=resp)
