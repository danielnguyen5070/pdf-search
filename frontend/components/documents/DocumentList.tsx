"use client";

import { DocumentCard } from "@/components/documents/DocumentCard";
import type { Document } from "@/types/api";

export function DocumentList({ documents }: { documents: Document[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
