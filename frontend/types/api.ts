export interface Document {
  id: string;
  filename: string;
  page_count: number;
  created_at: string;
  status?: "processing" | "ready" | "failed";
  file_url?: string;
}

export interface ChatRequest {
  document_id: string;
  message: string;
}

export interface Source {
  page: number;
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isLoading?: boolean;
  isError?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: "not_found" | "network" | "upload" | "chat" | "unknown"
  ) {
    super(message);
    this.name = "ApiError";
  }
}
