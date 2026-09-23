import hashlib
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any
from uuid import UUID

from fastapi import HTTPException, UploadFile, status

from app.config import Settings, get_settings
from app.services.chunk_service import chunk_pages
from app.services.pdf_parser import parse_pdf
from app.services.weaviate_service import delete_chunks_by_document_id, store_chunks

DOCUMENT_VERSION = 1


class DocumentService:
    """Handles PDF upload, metadata persistence, and document retrieval."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._lock = Lock()
        self._ensure_storage()

    def _ensure_storage(self) -> None:
        self.settings.storage_dir.mkdir(parents=True, exist_ok=True)
        if not self.settings.metadata_file.exists():
            self.settings.metadata_file.parent.mkdir(parents=True, exist_ok=True)
            self._write_metadata({})

    def _read_metadata(self) -> dict[str, dict[str, Any]]:
        with self.settings.metadata_file.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else {}

    def _write_metadata(self, data: dict[str, dict[str, Any]]) -> None:
        with self.settings.metadata_file.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, default=str)

    def _save_metadata(self, record: dict[str, Any]) -> None:
        with self._lock:
            metadata = self._read_metadata()
            metadata[record["id"]] = record
            self._write_metadata(metadata)

    def _validate_pdf(self, file: UploadFile) -> None:
        filename = file.filename or ""
        content_type = (file.content_type or "").lower()
        extension = Path(filename).suffix.lower()

        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required.",
            )

        if extension != self.settings.allowed_extension:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF files are allowed.",
            )

        if content_type and content_type != self.settings.allowed_content_type:
            # Some clients omit or misreport content_type; still reject clear mismatches.
            if content_type not in ("application/octet-stream",):
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Only application/pdf content type is allowed.",
                )

    async def upload(self, file: UploadFile) -> dict[str, Any]:
        """
        Upload PDF → local storage → PyMuPDF → chunking → Weaviate.

        Only returns status=processed when parse + Weaviate storage succeed.
        """
        self._validate_pdf(file)

        document_id = uuid.uuid4()
        filename = file.filename or f"{document_id}.pdf"
        stored_filename = f"{document_id}.pdf"
        relative_path = self.settings.storage_dir / stored_filename
        absolute_path = relative_path.resolve()

        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        if not content.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="File content is not a valid PDF.",
            )

        file_hash = hashlib.sha256(content).hexdigest()
        absolute_path.write_bytes(content)

        created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        base_record: dict[str, Any] = {
            "id": str(document_id),
            "filename": filename,
            "content_type": self.settings.allowed_content_type,
            "size": len(content),
            "path": str(relative_path).replace("\\", "/"),
            "created_at": created_at,
            "file_hash": file_hash,
            "version": DOCUMENT_VERSION,
            "status": "failed",
            "page_count": 0,
            "chunks": 0,
            "chunk_count": 0,
        }

        try:
            pages = parse_pdf(absolute_path, str(document_id))
            chunks = chunk_pages(pages)
            stored = store_chunks(
                chunks,
                filename=filename,
                file_hash=file_hash,
                version=DOCUMENT_VERSION,
            )
        except HTTPException:
            self._save_metadata(base_record)
            raise
        except Exception as exc:
            self._save_metadata(base_record)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process PDF: {exc}",
            ) from exc

        record: dict[str, Any] = {
            **base_record,
            "status": "processed",
            "page_count": len(pages),
            "chunks": stored,
            "chunk_count": stored,
        }
        self._save_metadata(record)
        return record

    def list_documents(self) -> list[dict[str, Any]]:
        with self._lock:
            metadata = self._read_metadata()
        documents = list(metadata.values())
        documents.sort(key=lambda item: item.get("created_at", ""), reverse=True)
        return documents

    def get_document(self, document_id: UUID) -> dict[str, Any]:
        with self._lock:
            metadata = self._read_metadata()
            record = metadata.get(str(document_id))

        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found.",
            )
        return record

    def get_document_file_path(self, document_id: UUID) -> tuple[Path, dict[str, Any]]:
        record = self.get_document(document_id)
        file_path = Path(record["path"])
        if not file_path.is_absolute():
            file_path = file_path.resolve()

        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File for document {document_id} is missing on disk.",
            )
        return file_path, record

    def delete(self, document_id: UUID) -> dict[str, str]:
        """
        Delete PDF from storage and all matching Weaviate chunks.

        Raises 404 if the document is not found in metadata.
        """
        record = self.get_document(document_id)
        document_id_str = str(document_id)

        file_path = Path(
            record.get("path") or (self.settings.storage_dir / f"{document_id_str}.pdf")
        )
        if not file_path.is_absolute():
            file_path = file_path.resolve()
        if file_path.exists() and file_path.is_file():
            file_path.unlink()

        try:
            delete_chunks_by_document_id(document_id_str)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete Weaviate chunks: {exc}",
            ) from exc

        with self._lock:
            metadata = self._read_metadata()
            metadata.pop(document_id_str, None)
            self._write_metadata(metadata)

        return {"id": document_id_str, "status": "deleted"}


_document_service: DocumentService | None = None


def get_document_service() -> DocumentService:
    global _document_service
    if _document_service is None:
        _document_service = DocumentService()
    return _document_service
