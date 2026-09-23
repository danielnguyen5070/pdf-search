from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentUploadResponse(BaseModel):
    """Response returned by POST /documents after full processing."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    status: Literal["processed", "failed"]
    chunks: int = Field(..., ge=0)


class DocumentDeleteResponse(BaseModel):
    """Response returned by DELETE /documents/{document_id}."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    status: Literal["deleted"]


class DocumentResponse(BaseModel):
    """Document metadata for list/detail endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    content_type: str
    size: int
    created_at: datetime
    status: str | None = None
    chunks: int | None = None
    page_count: int | None = None
