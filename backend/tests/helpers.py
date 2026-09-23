"""Helpers for building small fixture PDFs in tests."""

from pathlib import Path

import fitz


def create_sample_pdf(path: Path, pages: list[str]) -> Path:
    """Write a multi-page PDF with the given page texts."""
    document = fitz.open()
    try:
        for text in pages:
            page = document.new_page()
            rect = fitz.Rect(50, 50, 545, 792)
            page.insert_textbox(rect, text, fontsize=11, align=fitz.TEXT_ALIGN_LEFT)
        path.parent.mkdir(parents=True, exist_ok=True)
        document.save(path)
    finally:
        document.close()
    return path
