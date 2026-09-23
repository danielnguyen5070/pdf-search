"use client";

import { DocumentCard } from "@/components/documents/DocumentCard";
import type { Document } from "@/types/api";

interface DocumentListProps {
  documents: Document[];
  selectedId?: string | null;
  onSelect?: (document: Document) => void;
}

export function DocumentList({
  documents,
  selectedId,
  onSelect,
}: DocumentListProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          selected={doc.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
