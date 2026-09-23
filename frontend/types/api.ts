export interface Document {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
  status?: string | null;
  chunks?: number | null;
  page_count?: number | null;
}

export interface DocumentUploadResult {
  id: string;
  filename: string;
  status: "processed" | "failed";
  chunks: number;
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
