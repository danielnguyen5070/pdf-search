"""DeepSeek LLM client (OpenAI-compatible SDK)."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from openai import OpenAI

from app.config import get_settings

DEEPSEEK_BASE_URL = "https://api.deepseek.com"


def get_llm_client() -> OpenAI:
    """Return an OpenAI client pointed at DeepSeek. API key stays server-side."""
    settings = get_settings()
    if not settings.deepseek_api_key:
        raise RuntimeError(
            "DEEPSEEK_API_KEY is not configured. Set it in the backend environment."
        )
    return OpenAI(
        api_key=settings.deepseek_api_key,
        base_url=DEEPSEEK_BASE_URL,
    )


def stream_chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.2,
) -> Iterator[str]:
    """
    Stream assistant text deltas from DeepSeek.

    Yields content string fragments (tokens/chunks) as they arrive.
    """
    settings = get_settings()
    client = get_llm_client()

    stream = client.chat.completions.create(
        model=settings.deepseek_model,
        messages=messages,  # type: ignore[arg-type]
        temperature=temperature,
        stream=True,
    )

    for event in stream:
        choices = getattr(event, "choices", None) or []
        if not choices:
            continue
        delta: Any = choices[0].delta
        content = getattr(delta, "content", None)
        if content:
            yield content
