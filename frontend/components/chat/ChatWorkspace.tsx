"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DocumentsSidebar } from "@/components/documents/DocumentsSidebar";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { useDocuments } from "@/hooks/use-documents";
import type { Document } from "@/types/api";

export function ChatWorkspace() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // null = All Documents (default)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  const { data, isLoading, isError, error, refetch } = useDocuments();
  const documents = data ?? [];

  const selectedDocument =
    selectedDocumentId === null
      ? null
      : (documents.find((doc) => doc.id === selectedDocumentId) ?? null);

  // Clear selection if the selected document was deleted → fall back to All Documents.
  useEffect(() => {
    if (
      selectedDocumentId &&
      !documents.some((doc) => doc.id === selectedDocumentId)
    ) {
      setSelectedDocumentId(null);
    }
  }, [documents, selectedDocumentId]);

  const handleSelectAll = () => {
    setSelectedDocumentId(null);
    setMobileOpen(false);
  };

  const handleSelect = (document: Document) => {
    setSelectedDocumentId(document.id);
    setMobileOpen(false);
  };

  const sidebarProps = {
    documents,
    selectedId: selectedDocumentId,
    onSelectAll: handleSelectAll,
    onSelect: handleSelect,
    onUpload: () => {
      setMobileOpen(false);
      setUploadOpen(true);
    },
    isLoading,
    isError,
    error,
    onRetry: () => refetch(),
  };

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-[320px] shrink-0 overflow-hidden border-r border-border md:flex md:flex-col">
        <DocumentsSidebar {...sidebarProps} />
      </aside>

      {/* Mobile documents drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100%,20rem)] max-w-[85vw] overflow-hidden p-0" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Documents</SheetTitle>
            <SheetDescription>Select or upload a PDF</SheetDescription>
          </SheetHeader>
          <DocumentsSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ChatPanel
          document={selectedDocument}
          selectedDocumentId={selectedDocumentId}
          headerActions={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open documents"
            >
              <Menu className="size-4" />
            </Button>
          }
        />
      </main>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={(doc) => setSelectedDocumentId(doc.id)}
      />
    </div>
  );
}
