"use client";

import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyDocuments({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <FileText className="size-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium tracking-tight">No documents yet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Upload a PDF to get started. Only <code>.pdf</code> files are supported.
      </p>
      <Button className="mt-6" onClick={onUpload}>
        <Upload className="size-4" />
        Upload PDF
      </Button>
    </div>
  );
}
