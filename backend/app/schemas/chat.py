from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    """POST /api/v1/chat body."""

    model_config = ConfigDict(str_strip_whitespace=True)

    # null = search across all documents; UUID = filter to that document
    document_id: UUID | None = None
    message: str = Field(..., min_length=1, max_length=8000)


class ChatSource(BaseModel):
    """Source excerpt returned with the SSE done event."""

    document_id: str
    filename: str
    page: int
    content: str
