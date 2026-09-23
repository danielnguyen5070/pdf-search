# ChatPDF Frontend

Next.js frontend for a Chat with PDF / RAG application.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- React Hook Form (available for forms)
- lucide-react

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Backend API contract

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/documents` | Upload PDF (`multipart/form-data`, field: `file`) |
| `GET` | `/documents` | List documents |
| `GET` | `/documents/{id}` | Get document metadata |
| `GET` | `/documents/{id}/file` | Serve PDF file (for viewer) |
| `POST` | `/chat` | Ask a question about a document |

### Document shape

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "book.pdf",
  "content_type": "application/pdf",
  "size": 123456,
  "created_at": "2026-09-23T10:00:00Z"
}
```

### Chat request / response

```json
{
  "document_id": "doc_123",
  "message": "What is RAG?"
}
```

```json
{
  "answer": "...",
  "sources": [{ "page": 12, "content": "..." }]
}
```

## App routes

- `/` — Documents dashboard + upload
- `/chat/[documentId]` — PDF viewer + chat
