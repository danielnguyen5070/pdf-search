"use client";

import { FileText, Library } from "lucide-react";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/api";

interface DocumentListProps {
  documents: Document[];
  selectedId?: string | null;
  /** When true, "All Documents" is the active selection (selectedId is null). */
  allDocumentsSelected?: boolean;
  onSelectAll?: () => void;
  onSelect?: (document: Document) => void;
}

export function DocumentList({
  documents,
  selectedId,
  allDocumentsSelected = false,
  onSelectAll,
  onSelect,
}: DocumentListProps) {
  const showAllOption = typeof onSelectAll === "function";

  return (
    <div className="flex flex-col gap-1 p-2">
      {showAllOption ? (
        <button
          type="button"
          aria-pressed={allDocumentsSelected}
          onClick={() => onSelectAll()}
          className={cn(
            "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2.5 text-left transition-colors",
            allDocumentsSelected
              ? "border-foreground/20 bg-muted"
              : "border-transparent hover:bg-muted/60"
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
              allDocumentsSelected ? "bg-background" : "bg-muted"
            )}
          >
            <Library className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium leading-snug">
              {allDocumentsSelected ? (
                <span
                  className="inline-block size-1.5 shrink-0 rounded-full bg-foreground"
                  aria-hidden
                />
              ) : null}
              All Documents
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Search across every PDF
            </p>
          </div>
        </button>
      ) : null}

      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          selected={
            showAllOption
              ? !allDocumentsSelected && doc.id === selectedId
              : doc.id === selectedId
          }
          onSelect={onSelect}
        />
      ))}

      {showAllOption && documents.length === 0 ? (
        <div className="flex flex-col items-center px-2 py-6 text-center">
          <FileText className="mb-2 size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            No PDFs uploaded yet
          </p>
        </div>
      ) : null}
    </div>
  );
}
