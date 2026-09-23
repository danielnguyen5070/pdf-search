import { apiFetch } from "@/lib/api/client";
import type { Document } from "@/types/api";

export async function getDocuments(): Promise<Document[]> {
  const data = await apiFetch<Document[] | { documents: Document[] }>(
    "/documents"
  );
  return Array.isArray(data) ? data : data.documents;
}

export async function getDocument(id: string): Promise<Document> {
  return apiFetch<Document>(`/documents/${id}`, {}, "not_found");
}

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<Document>(
    "/documents",
    {
      method: "POST",
      body: formData,
    },
    "upload"
  );
}
