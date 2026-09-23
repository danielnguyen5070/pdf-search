import { ApiError } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("NEXT_PUBLIC_API_URL is not set");
}

export function getApiUrl(): string {
  if (!API_URL) {
    throw new ApiError(
      "Unable to connect to the server. Please make sure the backend is running.",
      0,
      "network"
    );
  }
  return API_URL.replace(/\/$/, "");
}

function userFacingMessage(status: number, code?: ApiError["code"]): string {
  if (code === "network" || status === 0) {
    return "Unable to connect to the server. Please make sure the backend is running.";
  }
  if (status === 404 || code === "not_found") {
    return "Document not found.";
  }
  if (code === "upload") {
    return "Unable to upload PDF. Please try again.";
  }
  if (code === "chat") {
    return "Something went wrong while processing your question. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

async function parseError(
  response: Response,
  code?: ApiError["code"]
): Promise<ApiError> {
  const status = response.status;
  const resolvedCode =
    code ?? (status === 404 ? "not_found" : status === 0 ? "network" : "unknown");

  return new ApiError(userFacingMessage(status, resolvedCode), status, resolvedCode);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  errorCode?: ApiError["code"]
): Promise<T> {
  const base = getApiUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please make sure the backend is running.",
      0,
      "network"
    );
  }

  if (!response.ok) {
    throw await parseError(response, errorCode);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getDocumentFileUrl(documentId: string, page?: number): string {
  const base = getApiUrl();
  const url = `${base}/documents/${documentId}/file`;
  if (page && page > 0) {
    return `${url}#page=${page}`;
  }
  return url;
}
