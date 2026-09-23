"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUploadDocument } from "@/hooks/use-documents";
import { getErrorMessage } from "@/lib/utils-app";
import { cn } from "@/lib/utils";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navigateOnSuccess?: boolean;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  navigateOnSuccess = true,
}: UploadDocumentDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useUploadDocument();

  const reset = useCallback(() => {
    setFile(null);
    setValidationError(null);
    setProgress(0);
    setDragActive(false);
    upload.reset();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [upload]);

  const handleOpenChange = (next: boolean) => {
    if (upload.isPending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const validateAndSetFile = (candidate: File | null) => {
    setValidationError(null);
    if (!candidate) {
      setFile(null);
      return;
    }
    const isPdf =
      candidate.type === "application/pdf" ||
      candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setValidationError("Only PDF files are supported.");
      return;
    }
    setFile(candidate);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setValidationError(null);
    setProgress(15);

    const progressTimer = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 8));
    }, 400);

    try {
      const document = await upload.mutateAsync(file);
      setProgress(100);
      window.clearInterval(progressTimer);
      handleOpenChange(false);
      if (navigateOnSuccess) {
        router.push(`/chat/${document.id}`);
      }
    } catch {
      window.clearInterval(progressTimer);
      setProgress(0);
    }
  };

  const errorMessage =
    validationError ||
    (upload.error
      ? getErrorMessage(upload.error, "Unable to upload PDF. Please try again.")
      : null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload PDF</DialogTitle>
          <DialogDescription>
            Select a PDF document to chat with.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
            dragActive
              ? "border-foreground/40 bg-muted/50"
              : "border-border bg-muted/20",
            upload.isPending && "pointer-events-none opacity-60"
          )}
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <FileUp className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Drag & drop PDF here</p>
            <p className="text-xs text-muted-foreground">or</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            Choose File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) =>
              validateAndSetFile(e.target.files?.[0] ?? null)
            }
          />
        </div>

        {file && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="truncate font-medium">{file.name}</span>
            {!upload.isPending && (
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => validateAndSetFile(null)}
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        {upload.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                Processing PDF...
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={upload.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!file || upload.isPending}
            onClick={handleUpload}
          >
            {upload.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
