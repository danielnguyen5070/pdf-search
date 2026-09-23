from pathlib import Path

from app.schemas.chunk import DocumentChunk
from app.services.chunk_service import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    chunk_pages,
    create_chunks_from_pdf,
)
from app.services.pdf_parser import parse_pdf
from tests.helpers import create_sample_pdf


def test_parse_pdf_extracts_text_and_page_metadata(tmp_path: Path) -> None:
    pdf_path = create_sample_pdf(
        tmp_path / "sample.pdf",
        pages=[
            "Page one discusses retrieval augmented generation.",
            "Page two covers chunking and embeddings.",
        ],
    )
    document_id = "doc-test-001"

    pages = parse_pdf(pdf_path, document_id)

    assert len(pages) == 2
    assert pages[0].document_id == document_id
    assert pages[0].page_number == 1
    assert "retrieval augmented generation" in pages[0].content
    assert pages[1].page_number == 2
    assert "chunking and embeddings" in pages[1].content


def test_chunk_pages_preserves_page_numbers_and_indexes(tmp_path: Path) -> None:
    # Long enough to force multiple chunks on page 1 with chunk_size=800.
    page_one = ("Alpha sentence about PDF search. " * 40).strip()
    page_two = ("Beta sentence about page sources. " * 5).strip()
    assert len(page_one) > CHUNK_SIZE

    pdf_path = create_sample_pdf(
        tmp_path / "chunk-sample.pdf",
        pages=[page_one, page_two],
    )
    document_id = "doc-test-002"

    pages = parse_pdf(pdf_path, document_id)
    chunks = chunk_pages(pages)

    assert chunks, "expected at least one chunk"
    assert all(isinstance(chunk, DocumentChunk) for chunk in chunks)
    assert [chunk.chunk_index for chunk in chunks] == list(range(len(chunks)))
    assert all(chunk.document_id == document_id for chunk in chunks)
    assert all(chunk.page_number in (1, 2) for chunk in chunks)
    assert any(chunk.page_number == 1 for chunk in chunks)
    assert any(chunk.page_number == 2 for chunk in chunks)
    assert all(len(chunk.content) <= CHUNK_SIZE + 50 for chunk in chunks)

    # Overlap setting is configured on the splitter.
    assert CHUNK_OVERLAP == 80


def test_create_chunks_from_pdf_end_to_end(tmp_path: Path) -> None:
    pdf_path = create_sample_pdf(
        tmp_path / "pipeline.pdf",
        pages=[
            "Introduction to RAG pipelines.",
            "Parsing with PyMuPDF keeps page metadata.",
        ],
    )

    chunks = create_chunks_from_pdf(str(pdf_path), "doc-pipeline")

    assert len(chunks) >= 2
    assert chunks[0].chunk_index == 0
    assert "RAG" in chunks[0].content or any("RAG" in c.content for c in chunks)
    assert any("PyMuPDF" in c.content for c in chunks)
    assert {c.page_number for c in chunks} == {1, 2}
