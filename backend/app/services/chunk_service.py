"""Split extracted PDF page text into overlapping chunks."""

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.schemas.chunk import DocumentChunk, PageText
from app.services.pdf_parser import parse_pdf

CHUNK_SIZE = 800
CHUNK_OVERLAP = 80


def get_text_splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )


def chunk_pages(pages: list[PageText]) -> list[DocumentChunk]:
    """
    Chunk each page independently so every chunk keeps its source page_number.
    """
    splitter = get_text_splitter()
    chunks: list[DocumentChunk] = []
    chunk_index = 0

    for page in pages:
        content = page.content.strip()
        if not content:
            continue

        parts = splitter.split_text(content)
        for part in parts:
            text = part.strip()
            if not text:
                continue
            chunks.append(
                DocumentChunk(
                    document_id=page.document_id,
                    page_number=page.page_number,
                    content=text,
                    chunk_index=chunk_index,
                )
            )
            chunk_index += 1

    return chunks


def create_chunks_from_pdf(file_path: str, document_id: str) -> list[DocumentChunk]:
    """
    Full parse → chunk pipeline for a stored PDF.

    Upload PDF → Local Storage → PyMuPDF → Page Text → Chunking → List[DocumentChunk]
    """
    pages = parse_pdf(file_path, document_id)
    return chunk_pages(pages)
