"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useDocument } from "@/hooks/use-documents";
import { ApiError } from "@/types/api";
import { cn } from "@/lib/utils";

interface ChatPageClientProps {
  documentId: string;
}

export function ChatPageClient({ documentId }: ChatPageClientProps) {
  const { data: document, isLoading, isError, error, refetch } =
    useDocument(documentId);
  const [activePage, setActivePage] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "pdf">("chat");

  const handleSourceClick = (pageNumber: number) => {
    setActivePage(pageNumber);
    setMobileTab("pdf");
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col">
        <ChatHeader filename="Loading..." />
        <LoadingState message="Loading document..." className="flex-1" />
      </div>
    );
  }

  if (isError || !document) {
    const notFound =
      error instanceof ApiError &&
      (error.code === "not_found" || error.status === 404);

    return (
      <div className="flex h-dvh flex-col">
        <ChatHeader filename="Document" />
        <ErrorState
          error={error}
          title={notFound ? "Document not found" : "Unable to load document"}
          fallback={
            notFound
              ? "Document not found."
              : "Unable to connect to the server. Please make sure the backend is running."
          }
          onRetry={notFound ? undefined : () => refetch()}
          showBackLink
        />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <ChatHeader filename={document.filename} />

      <div className="border-b border-border px-3 py-2 md:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "chat" | "pdf")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare className="size-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex-1 gap-1.5">
              <FileText className="size-3.5" />
              PDF
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-2">
        <div
          className={cn(
            "min-h-0 border-r border-border",
            mobileTab === "pdf" ? "block" : "hidden",
            "md:block"
          )}
        >
          <PdfViewer
            documentId={documentId}
            page={activePage}
          />
        </div>
        <div
          className={cn(
            "min-h-0",
            mobileTab === "chat" ? "block" : "hidden",
            "md:block"
          )}
        >
          <ChatWindow
            documentId={documentId}
            onSourceClick={handleSourceClick}
          />
        </div>
      </div>
    </div>
  );
}

function ChatHeader({ filename }: { filename: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link href="/">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Documents</span>
          </Link>
        </Button>
        <div className="h-4 w-px bg-border" />
        <p className="truncate text-sm font-medium">{filename}</p>
      </div>
    </header>
  );
}
