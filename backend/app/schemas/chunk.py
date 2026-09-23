from pydantic import BaseModel, ConfigDict, Field


class PageText(BaseModel):
    """Text extracted from a single PDF page."""

    model_config = ConfigDict(from_attributes=True)

    document_id: str
    page_number: int = Field(..., ge=1, description="1-based PDF page number")
    content: str


class DocumentChunk(BaseModel):
    """A text chunk derived from a PDF page, ready for later embedding."""

    model_config = ConfigDict(from_attributes=True)

    document_id: str
    page_number: int = Field(..., ge=1, description="1-based source page number")
    content: str
    chunk_index: int = Field(..., ge=0, description="0-based index within the document")
