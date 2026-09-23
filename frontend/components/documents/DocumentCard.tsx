"use client";

import { useState } from "react";
import { ExternalLink, FileText, Loader2, MoreVertical, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteDocument } from "@/hooks/use-documents";
import { getDocumentFileUrl } from "@/lib/api/client";
import { formatDate, formatFileSize, getErrorMessage } from "@/lib/utils-app";
import type { Document } from "@/types/api";

export function DocumentCard({ document }: { document: Document }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteMutation = useDeleteDocument();

  const isDeleting = deleteMutation.isPending;
  const deleteError = deleteMutation.error
    ? getErrorMessage(deleteMutation.error, "Unable to delete PDF. Please try again.")
    : null;

  const handleOpen = () => {
    window.open(getDocumentFileUrl(document.id), "_blank", "noopener,noreferrer");
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(document.id);
      setConfirmOpen(false);
    } catch {
      // Error is shown via deleteMutation.error
    }
  };

  const handleConfirmOpenChange = (open: boolean) => {
    if (isDeleting) return;
    if (!open) {
      deleteMutation.reset();
    }
    setConfirmOpen(open);
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <CardTitle className="min-w-0 flex-1 line-clamp-2 text-base font-medium leading-snug">
              {document.filename}
            </CardTitle>
            <button
              type="button"
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Document options"
              onClick={() => handleConfirmOpenChange(true)}
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{formatFileSize(document.size)}</p>
          <p>{formatDate(document.created_at)}</p>
        </CardContent>
        <CardFooter className="justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={handleOpen}
          >
            <ExternalLink className="size-3.5" />
            Open
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => handleConfirmOpenChange(true)}
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete PDF</DialogTitle>
            <DialogDescription>
              Delete <span className="font-medium text-foreground">{document.filename}</span>?
              This removes the file and its indexed chunks. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => handleConfirmOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
