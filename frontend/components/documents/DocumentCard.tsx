"use client";

import { useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
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
import { formatDate, formatFileSize, getErrorMessage } from "@/lib/utils-app";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/api";

interface DocumentCardProps {
  document: Document;
  selected?: boolean;
  onSelect?: (document: Document) => void;
}

export function DocumentCard({
  document,
  selected = false,
  onSelect,
}: DocumentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteMutation = useDeleteDocument();

  const isDeleting = deleteMutation.isPending;
  const deleteError = deleteMutation.error
    ? getErrorMessage(
        deleteMutation.error,
        "Unable to delete PDF. Please try again."
      )
    : null;

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
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={() => onSelect?.(document)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(document);
          }
        }}
        className={cn(
          "group flex w-full min-w-0 max-w-full cursor-pointer items-start gap-2.5 overflow-hidden rounded-lg border px-2.5 py-2.5 text-left transition-colors",
          selected
            ? "border-foreground/20 bg-muted"
            : "border-transparent hover:bg-muted/60",
          isDeleting && "pointer-events-none opacity-60"
        )}
      >
        <div
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
            selected ? "bg-background" : "bg-muted"
          )}
        >
          <FileText className="size-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-center gap-1.5">
            {selected ? (
              <span
                className="inline-block size-1.5 shrink-0 rounded-full bg-foreground"
                aria-hidden
              />
            ) : null}
            <p className="truncate text-sm font-medium leading-snug">
              {document.filename}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatFileSize(document.size)} · {formatDate(document.created_at)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          disabled={isDeleting}
          aria-label={`Delete ${document.filename}`}
          onClick={(e) => {
            e.stopPropagation();
            handleConfirmOpenChange(true);
          }}
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete PDF</DialogTitle>
            <DialogDescription>
              Delete{" "}
              <span className="font-medium text-foreground">
                {document.filename}
              </span>
              ? This removes the file and its indexed chunks. This cannot be
              undone.
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
