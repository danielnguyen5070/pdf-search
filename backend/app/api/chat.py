"""Streaming RAG chat endpoint."""

from __future__ import annotations

import json
from collections.abc import Iterator
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.document_service import DocumentService, get_document_service
from app.services.llm_service import stream_chat_completion
from app.services.weaviate_service import search_chunks

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

SYSTEM_PROMPT = """You are a helpful assistant that answers questions about PDF documents.
Use only the provided context excerpts. If the answer is not in the context, say you do not know.
When relevant, mention page numbers and document filenames from the context (e.g. "Page 3 in report.pdf").
Keep answers clear and concise."""


def _sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "No relevant excerpts were found."

    parts: list[str] = []
    for index, chunk in enumerate(chunks, start=1):
        page = chunk.get("page_number") or "?"
        filename = chunk.get("filename") or "document.pdf"
        content = str(chunk.get("content", "")).strip()
        parts.append(f"[Excerpt {index} | {filename} | Page {page}]\n{content}")
    return "\n\n".join(parts)


def _chunks_to_sources(chunks: list[dict]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    for chunk in chunks:
        content = str(chunk.get("content", "")).strip()
        if not content:
            continue
        sources.append(
            {
                "document_id": str(chunk.get("document_id") or ""),
                "filename": str(chunk.get("filename") or "document.pdf"),
                "page": int(chunk.get("page_number") or 0),
                "content": content,
            }
        )
    return sources


def _build_messages(
    *,
    scope_label: str,
    question: str,
    chunks: list[dict],
) -> list[dict[str, str]]:
    context = _build_context(chunks)
    user_prompt = (
        f"Search scope: {scope_label}\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Answer based only on the context above."
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


def _stream_answer(
    *,
    document_id: UUID | None,
    message: str,
    scope_label: str,
) -> Iterator[str]:
    sources: list[dict[str, Any]] = []
    try:
        # document_id=None → all documents; otherwise filter to that PDF only.
        # Top 3 chunks via settings.rag_top_k (default 3).
        chunks = search_chunks(
            str(document_id) if document_id is not None else None,
            message,
        )
        sources = _chunks_to_sources(chunks)
        messages = _build_messages(
            scope_label=scope_label,
            question=message,
            chunks=chunks,
        )
        for token in stream_chat_completion(messages):
            yield _sse({"type": "token", "content": token})
        yield _sse({"type": "done", "sources": sources})
    except Exception as exc:
        yield _sse({"type": "error", "content": str(exc)})
        yield _sse({"type": "done", "sources": sources})


@router.post(
    "",
    summary="Ask a question about a document or all documents (SSE stream)",
    response_class=StreamingResponse,
)
async def chat(
    body: ChatRequest,
    service: DocumentService = Depends(get_document_service),
) -> StreamingResponse:
    if body.document_id is not None:
        record = service.get_document(body.document_id)
        scope_label = str(record.get("filename") or "document.pdf")
    else:
        scope_label = "All Documents"

    return StreamingResponse(
        _stream_answer(
            document_id=body.document_id,
            message=body.message,
            scope_label=scope_label,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
