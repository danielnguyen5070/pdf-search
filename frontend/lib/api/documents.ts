import { apiFetch } from "@/lib/api/client";
import type {
  Document,
  DocumentDeleteResult,
  DocumentUploadResult,
} from "@/types/api";

export async function getDocuments(): Promise<Document[]> {
  const data = await apiFetch<Document[] | { documents: Document[] }>(
    "/documents"
  );
  return Array.isArray(data) ? data : data.documents;
}

export async function getDocument(id: string): Promise<Document> {
  return apiFetch<Document>(`/documents/${id}`, {}, "not_found");
}

/**
 * Upload a PDF via multipart/form-data.
 * POST ${NEXT_PUBLIC_API_URL}/documents — field name: `file`
 */
export async function uploadDocument(file: File): Promise<DocumentUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<DocumentUploadResult>(
    "/documents",
    {
      method: "POST",
      body: formData,
    },
    "upload"
  );
}

/**
 * Delete a PDF and its Weaviate chunks.
 * DELETE ${NEXT_PUBLIC_API_URL}/documents/{documentId}
 */
export async function deleteDocument(
  documentId: string
): Promise<DocumentDeleteResult> {
  return apiFetch<DocumentDeleteResult>(
    `/documents/${documentId}`,
    { method: "DELETE" },
    "not_found"
  );
}
