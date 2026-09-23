"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadDocument } from "@/lib/api/documents";
import { documentKeys } from "@/hooks/use-documents";
import { formatDate, formatFileSize, getErrorMessage } from "@/lib/utils-app";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/api";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: (document: Document) => void;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onUploaded,
}: UploadDocumentDialogProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(
    null
  );

  const reset = useCallback(() => {
    setFile(null);
    setValidationError(null);
    setUploadError(null);
    setIsUploading(false);
    setUploadedDocument(null);
    setDragActive(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (isUploading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const validateAndSetFile = (candidate: File | null) => {
    setValidationError(null);
    setUploadError(null);
    setUploadedDocument(null);

    if (!candidate) {
      setFile(null);
      return;
    }

    const isPdf =
      candidate.type === "application/pdf" ||
      candidate.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      setValidationError("Only PDF files are allowed.");
      return;
    }

    setFile(candidate);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    setValidationError(null);
    setUploadError(null);
    setIsUploading(true);

    try {
      const document = await uploadDocument(file);
      setUploadedDocument(document);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: documentKeys.all });
      onUploaded?.(document);
    } catch (error) {
      setUploadError(
        getErrorMessage(error, "Unable to upload PDF. Please try again.")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const errorMessage = validationError || uploadError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload PDF</DialogTitle>
          <DialogDescription>
            Choose a PDF file to upload. Only <code>.pdf</code> files are
            accepted.
          </DialogDescription>
        </DialogHeader>

        {uploadedDocument ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">Upload successful</p>
                <p className="text-xs text-muted-foreground">
                  The PDF was saved by the server.
                </p>
              </div>
            </div>

            <dl className="space-y-2 rounded-lg border border-border px-3 py-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Filename</dt>
                <dd className="truncate font-medium text-right">
                  {uploadedDocument.filename}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">
                  {formatFileSize(uploadedDocument.size)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{uploadedDocument.content_type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Uploaded</dt>
                <dd className="font-medium">
                  {formatDate(uploadedDocument.created_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">ID</dt>
                <dd className="truncate font-mono text-xs text-right">
                  {uploadedDocument.id}
                </dd>
              </div>
            </dl>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                }}
              >
                Upload another
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
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
                isUploading && "pointer-events-none opacity-60"
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
                disabled={isUploading}
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
                disabled={isUploading}
                onChange={(e) =>
                  validateAndSetFile(e.target.files?.[0] ?? null)
                }
              />
            </div>

            {file && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!isUploading && (
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

            {isUploading && (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Uploading PDF…
              </div>
            )}

            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!file || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
