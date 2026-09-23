"""Weaviate client helpers and DocumentChunk collection setup."""

from __future__ import annotations

from urllib.parse import urlparse

import weaviate
from weaviate.classes.config import Configure, DataType, Property
from weaviate.classes.query import Filter
from weaviate.client import WeaviateClient
from weaviate.exceptions import WeaviateBaseError

from app.config import get_settings
from app.schemas.chunk import DocumentChunk

COLLECTION_NAME = "DocumentChunk"

_client: WeaviateClient | None = None


def get_client() -> WeaviateClient:
    """Return a shared Weaviate client (connected lazily)."""
    global _client
    if _client is not None and _client.is_connected():
        return _client

    settings = get_settings()
    parsed = urlparse(settings.weaviate_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 8080
    secure = parsed.scheme == "https"

    _client = weaviate.connect_to_custom(
        http_host=host,
        http_port=port,
        http_secure=secure,
        grpc_host=host,
        grpc_port=settings.weaviate_grpc_port,
        grpc_secure=secure,
    )
    return _client


def close_client() -> None:
    """Close the shared Weaviate client if open."""
    global _client
    if _client is not None:
        try:
            if _client.is_connected():
                _client.close()
        finally:
            _client = None


def create_collection() -> None:
    """
    Ensure the DocumentChunk collection exists.

    Properties only — no vectorizer/embeddings yet.
    Safe to call on every app startup (idempotent).
    """
    client = get_client()
    if client.collections.exists(COLLECTION_NAME):
        return

    client.collections.create(
        name=COLLECTION_NAME,
        description="PDF text chunks for RAG retrieval",
        vectorizer_config=Configure.Vectorizer.none(),
        properties=[
            Property(name="document_id", data_type=DataType.TEXT),
            Property(name="filename", data_type=DataType.TEXT),
            Property(name="page_number", data_type=DataType.INT),
            Property(name="chunk_index", data_type=DataType.INT),
            Property(name="content", data_type=DataType.TEXT),
            Property(name="file_hash", data_type=DataType.TEXT),
            Property(name="version", data_type=DataType.INT),
        ],
    )


def store_chunks(
    chunks: list[DocumentChunk],
    *,
    filename: str,
    file_hash: str,
    version: int = 1,
) -> int:
    """
    Persist every chunk in the DocumentChunk collection.

    Returns the number of objects written.
    Raises on Weaviate / batch failures so callers do not mark the upload processed.
    """
    if not chunks:
        return 0

    create_collection()
    client = get_client()
    collection = client.collections.get(COLLECTION_NAME)

    try:
        with collection.batch.dynamic() as batch:
            for chunk in chunks:
                batch.add_object(
                    properties={
                        "document_id": chunk.document_id,
                        "filename": filename,
                        "page_number": chunk.page_number,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "file_hash": file_hash,
                        "version": version,
                    }
                )
    except WeaviateBaseError as exc:
        raise RuntimeError(f"Failed to store chunks in Weaviate: {exc}") from exc

    failed = collection.batch.failed_objects
    if failed:
        first = failed[0]
        message = getattr(first, "message", None) or str(first)
        raise RuntimeError(
            f"Failed to store {len(failed)} chunk(s) in Weaviate: {message}"
        )

    return len(chunks)


def delete_chunks_by_document_id(document_id: str) -> int:
    """
    Delete every DocumentChunk for the given document_id.

    Returns the number of objects deleted (0 if none / collection missing).
    """
    client = get_client()
    if not client.collections.exists(COLLECTION_NAME):
        return 0

    collection = client.collections.get(COLLECTION_NAME)

    try:
        result = collection.data.delete_many(
            where=Filter.by_property("document_id").equal(document_id)
        )
    except WeaviateBaseError as exc:
        raise RuntimeError(
            f"Failed to delete chunks for document {document_id}: {exc}"
        ) from exc

    deleted = getattr(result, "successful", None)
    if deleted is None:
        deleted = getattr(result, "matches", 0)
    return int(deleted or 0)


def search_chunks(
    document_id: str | None,
    query: str,
    *,
    limit: int | None = None,
) -> list[dict]:
    """
    Retrieve relevant DocumentChunk objects.

    When document_id is set, filters to that document only.
    When document_id is None, searches across all documents.

    Uses Weaviate BM25 over `content`
    (collection has no vectorizer yet — BM25 until embeddings are added).
    Falls back to the first N chunks if BM25 returns nothing.
    """
    settings = get_settings()
    top_k = limit if limit is not None else settings.rag_top_k

    client = get_client()
    if not client.collections.exists(COLLECTION_NAME):
        return []

    collection = client.collections.get(COLLECTION_NAME)
    document_filter = (
        Filter.by_property("document_id").equal(document_id)
        if document_id
        else None
    )

    try:
        bm25_kwargs: dict = {"query": query, "limit": top_k}
        if document_filter is not None:
            bm25_kwargs["filters"] = document_filter
        result = collection.query.bm25(**bm25_kwargs)
        objects = list(result.objects)
        if not objects:
            fetch_kwargs: dict = {"limit": top_k}
            if document_filter is not None:
                fetch_kwargs["filters"] = document_filter
            fallback = collection.query.fetch_objects(**fetch_kwargs)
            objects = list(fallback.objects)
    except WeaviateBaseError as exc:
        scope = f"document {document_id}" if document_id else "all documents"
        raise RuntimeError(f"Failed to search chunks for {scope}: {exc}") from exc

    chunks: list[dict] = []
    for obj in objects:
        props = obj.properties or {}
        content = props.get("content")
        if not content:
            continue
        chunks.append(
            {
                "document_id": props.get("document_id", document_id or ""),
                "filename": props.get("filename", ""),
                "page_number": int(props.get("page_number") or 0),
                "chunk_index": int(props.get("chunk_index") or 0),
                "content": str(content),
                "file_hash": props.get("file_hash", ""),
                "version": int(props.get("version") or 1),
            }
        )
    return chunks
