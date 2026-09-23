"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentListSkeleton } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import type { Document } from "@/types/api";

interface DocumentsSidebarProps {
  documents: Document[];
  selectedId: string | null;
  onSelectAll: () => void;
  onSelect: (document: Document) => void;
  onUpload: () => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export function DocumentsSidebar({
  documents,
  selectedId,
  onSelectAll,
  onSelect,
  onUpload,
  isLoading,
  isError,
  error,
  onRetry,
  className,
}: DocumentsSidebarProps) {
  const allDocumentsSelected = selectedId === null;

  return (
    <aside
      className={`flex h-full min-h-0 w-full flex-col bg-background ${className ?? ""}`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            Documents
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {documents.length} PDF{documents.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button type="button" size="sm" onClick={onUpload}>
          <Upload className="size-3.5" />
          Upload PDF
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="p-3">
            <DocumentListSkeleton compact />
          </div>
        ) : isError ? (
          <div className="p-3">
            <ErrorState
              error={error}
              title="Unable to load documents"
              fallback="Unable to connect to the server. Please make sure the backend is running."
              onRetry={onRetry}
            />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <DocumentList
              documents={documents}
              selectedId={selectedId}
              allDocumentsSelected={allDocumentsSelected}
              onSelectAll={onSelectAll}
              onSelect={onSelect}
            />
          </ScrollArea>
        )}
      </div>
    </aside>
  );
}
