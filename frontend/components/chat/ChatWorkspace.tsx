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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useDocuments();
  const documents = data ?? [];

  const selectedDocument =
    documents.find((doc) => doc.id === selectedId) ?? null;

  // Clear selection if the selected document was deleted.
  useEffect(() => {
    if (selectedId && !documents.some((doc) => doc.id === selectedId)) {
      setSelectedId(null);
    }
  }, [documents, selectedId]);

  const handleSelect = (document: Document) => {
    setSelectedId(document.id);
    setMobileOpen(false);
  };

  const sidebarProps = {
    documents,
    selectedId,
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
      <div className="hidden h-full w-[300px] shrink-0 border-r border-border md:flex">
        <DocumentsSidebar {...sidebarProps} />
      </div>

      {/* Mobile documents drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Documents</SheetTitle>
            <SheetDescription>Select or upload a PDF</SheetDescription>
          </SheetHeader>
          <DocumentsSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      <ChatPanel
        document={selectedDocument}
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

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={(doc) => setSelectedId(doc.id)}
      />
    </div>
  );
}
