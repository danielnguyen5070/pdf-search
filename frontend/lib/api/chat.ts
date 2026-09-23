import { apiFetch } from "@/lib/api/client";
import type { ChatRequest, ChatResponse } from "@/types/api";

export async function chatWithDocument(
  documentId: string,
  message: string
): Promise<ChatResponse> {
  const body: ChatRequest = {
    document_id: documentId,
    message,
  };

  return apiFetch<ChatResponse>(
    "/chat",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "chat"
  );
}
