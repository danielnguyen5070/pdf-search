"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentList } from "@/components/documents/DocumentList";
import { EmptyDocuments } from "@/components/documents/EmptyDocuments";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { DocumentListSkeleton } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useDocuments } from "@/hooks/use-documents";

export function DocumentsDashboard() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDocuments();

  const documents = data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight">PDF Search</h1>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="size-4" />
            Upload PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Your Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a PDF to store it on the server.
          </p>
        </div>

        {isLoading ? (
          <DocumentListSkeleton />
        ) : isError ? (
          <ErrorState
            error={error}
            title="Unable to load documents"
            fallback="Unable to connect to the server. Please make sure the backend is running."
            onRetry={() => refetch()}
          />
        ) : documents.length === 0 ? (
          <EmptyDocuments onUpload={() => setUploadOpen(true)} />
        ) : (
          <div className={isFetching ? "opacity-70 transition-opacity" : ""}>
            <DocumentList documents={documents} />
          </div>
        )}
      </main>

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
