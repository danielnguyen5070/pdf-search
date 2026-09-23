from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse

from app.schemas.document import (
    DocumentDeleteResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from app.services.document_service import DocumentService, get_document_service

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


def _to_upload_response(record: dict) -> DocumentUploadResponse:
    chunks = record.get("chunks", record.get("chunk_count", 0))
    return DocumentUploadResponse(
        id=UUID(record["id"]),
        filename=record["filename"],
        status=record["status"],
        chunks=int(chunks or 0),
    )


def _to_response(record: dict) -> DocumentResponse:
    created_at = record["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))

    chunks = record.get("chunks", record.get("chunk_count"))
    return DocumentResponse(
        id=UUID(record["id"]),
        filename=record["filename"],
        content_type=record["content_type"],
        size=record["size"],
        created_at=created_at,
        status=record.get("status"),
        chunks=int(chunks) if chunks is not None else None,
        page_count=record.get("page_count"),
    )


@router.post(
    "",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF document",
)
async def upload_document(
    file: UploadFile = File(..., description="PDF file to upload"),
    service: DocumentService = Depends(get_document_service),
) -> DocumentUploadResponse:
    record = await service.upload(file)
    return _to_upload_response(record)


@router.get(
    "",
    response_model=list[DocumentResponse],
    summary="List all documents",
)
async def list_documents(
    service: DocumentService = Depends(get_document_service),
) -> list[DocumentResponse]:
    records = service.list_documents()
    return [_to_response(record) for record in records]


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document metadata",
)
async def get_document(
    document_id: UUID,
    service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    record = service.get_document(document_id)
    return _to_response(record)


@router.get(
    "/{document_id}/file",
    summary="Download the original PDF file",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "The PDF file",
        }
    },
)
async def get_document_file(
    document_id: UUID,
    service: DocumentService = Depends(get_document_service),
) -> FileResponse:
    file_path, record = service.get_document_file_path(document_id)
    return FileResponse(
        path=file_path,
        media_type=record["content_type"],
        filename=record["filename"],
    )


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete a PDF document and its Weaviate chunks",
)
async def delete_document(
    document_id: UUID,
    service: DocumentService = Depends(get_document_service),
) -> DocumentDeleteResponse:
    result = service.delete(document_id)
    return DocumentDeleteResponse(id=result["id"], status="deleted")
