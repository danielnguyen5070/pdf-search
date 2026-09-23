"""Weaviate client helpers and DocumentChunk collection setup."""

from __future__ import annotations

from urllib.parse import urlparse

import weaviate
from weaviate.classes.config import Configure, DataType, Property
from weaviate.client import WeaviateClient

from app.config import get_settings

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
