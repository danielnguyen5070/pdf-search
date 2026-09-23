import { getApiUrl } from "@/lib/api/client";
import { ApiError } from "@/types/api";
import type { ChatRequest } from "@/types/api";

export interface StreamChatHandlers {
  onToken?: (token: string) => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

/**
 * POST /chat — SSE stream of token/error/done events.
 * document_id null searches across all documents.
 */
export async function streamChat(
  documentId: string | null,
  message: string,
  handlers: StreamChatHandlers = {}
): Promise<string> {
  const { onToken, onError, signal } = handlers;
  const body: ChatRequest = {
    document_id: documentId,
    message,
  };

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      "Unable to connect to the server. Please make sure the backend is running.",
      0,
      "network"
    );
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const errBody = (await response.json()) as { detail?: unknown };
      if (typeof errBody?.detail === "string" && errBody.detail.trim()) {
        detail = errBody.detail;
      }
    } catch {
      // ignore
    }
    throw new ApiError(
      detail ??
        "Something went wrong while processing your question. Please try again.",
      response.status,
      response.status === 404 ? "not_found" : "chat"
    );
  }

  if (!response.body) {
    throw new ApiError(
      "Something went wrong while processing your question. Please try again.",
      0,
      "chat"
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let streamError: string | null = null;

  const processEvent = (raw: string) => {
    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let event: { type?: string; content?: string };
      try {
        event = JSON.parse(payload) as { type?: string; content?: string };
      } catch {
        continue;
      }

      if (event.type === "token" && typeof event.content === "string") {
        answer += event.content;
        onToken?.(event.content);
      } else if (event.type === "error" && typeof event.content === "string") {
        streamError = event.content;
        onError?.(event.content);
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      if (part.trim()) processEvent(part);
    }
  }

  if (buffer.trim()) {
    processEvent(buffer);
  }

  if (streamError) {
    throw new ApiError(streamError, 500, "chat");
  }

  return answer;
}

/** Convenience wrapper that collects the full streamed answer. */
export async function chatWithDocument(
  documentId: string | null,
  message: string
): Promise<{ answer: string; sources: [] }> {
  const answer = await streamChat(documentId, message);
  return { answer, sources: [] };
}
