"""PDF text extraction with PyMuPDF."""

from pathlib import Path

import fitz  # PyMuPDF

from app.schemas.chunk import PageText


def parse_pdf(file_path: str | Path, document_id: str) -> list[PageText]:
    """
    Extract text from every page of a stored PDF.

    Page numbers are 1-based so the chat UI can show "Sources / Page X".
    Extracted text is returned in memory only — nothing is written to disk.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")
    if not path.is_file():
        raise ValueError(f"Not a file: {path}")

    pages: list[PageText] = []

    with fitz.open(path) as document:
        for index, page in enumerate(document):
            text = page.get_text("text") or ""
            pages.append(
                PageText(
                    document_id=document_id,
                    page_number=index + 1,
                    content=text,
                )
            )

    return pages
