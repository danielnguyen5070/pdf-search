import { getApiUrl } from "@/lib/api/client";
import { ApiError } from "@/types/api";
import type { ChatRequest, Source } from "@/types/api";

export interface StreamChatOptions {
  documentId: string | null;
  message: string;
  onToken?: (token: string) => void;
  onDone?: (sources: Source[]) => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

type StreamEvent = {
  type?: string;
  content?: string;
  sources?: Source[];
};

function normalizeSources(raw: unknown): Source[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const content = typeof row.content === "string" ? row.content : "";
      if (!content.trim()) return null;
      return {
        document_id: String(row.document_id ?? ""),
        filename: String(row.filename ?? "document.pdf"),
        page: Number(row.page ?? 0) || 0,
        content,
      } satisfies Source;
    })
    .filter((source): source is Source => source !== null);
}

/**
 * POST /chat — read the SSE stream with fetch + ReadableStream.
 *
 * documentId:
 *   null → search all documents
 *   id   → search only that document
 */
export async function streamChat({
  documentId,
  message,
  onToken,
  onDone,
  onError,
  signal,
}: StreamChatOptions): Promise<{ answer: string; sources: Source[] }> {
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
    const networkError =
      "Unable to connect to the server. Please make sure the backend is running.";
    onError?.(networkError);
    throw new ApiError(networkError, 0, "network");
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const errBody = (await response.json()) as { detail?: unknown };
      if (typeof errBody?.detail === "string" && errBody.detail.trim()) {
        detail = errBody.detail;
      }
    } catch {
      // ignore non-JSON error bodies
    }
    const messageText =
      detail ??
      "Something went wrong while processing your question. Please try again.";
    onError?.(messageText);
    throw new ApiError(
      messageText,
      response.status,
      response.status === 404 ? "not_found" : "chat"
    );
  }

  if (!response.body) {
    const messageText =
      "Something went wrong while processing your question. Please try again.";
    onError?.(messageText);
    throw new ApiError(messageText, 0, "chat");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let sources: Source[] = [];
  let streamError: string | null = null;
  let receivedDone = false;

  const processEvent = (raw: string) => {
    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let event: StreamEvent;
      try {
        event = JSON.parse(payload) as StreamEvent;
      } catch {
        continue;
      }

      if (event.type === "token" && typeof event.content === "string") {
        answer += event.content;
        onToken?.(event.content);
      } else if (event.type === "error" && typeof event.content === "string") {
        streamError = event.content;
        onError?.(event.content);
      } else if (event.type === "done") {
        receivedDone = true;
        sources = normalizeSources(event.sources);
        onDone?.(sources);
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

  if (!receivedDone) {
    onDone?.(sources);
  }

  if (streamError) {
    throw new ApiError(streamError, 500, "chat");
  }

  return { answer, sources };
}

/** Collect the full streamed answer (non-streaming callers). */
export async function chatWithDocument(
  documentId: string | null,
  message: string
): Promise<{ answer: string; sources: Source[] }> {
  return streamChat({ documentId, message });
}
