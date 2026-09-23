"use client";

import { useMemo, useState } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDocumentFileUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export interface PdfViewerProps {
  documentId: string;
  fileUrl?: string;
  /** Target page from source click (`onSourceClick`). Uses `#page=N`. */
  page?: number | null;
  className?: string;
  onPageChange?: (page: number) => void;
}

/**
 * Lightweight PDF viewer using the browser's built-in PDF renderer.
 * Page navigation uses the `#page=N` fragment supported by most browsers.
 */
export function PdfViewer({
  documentId,
  fileUrl,
  page,
  className,
}: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);

  const src = useMemo(() => {
    const base = fileUrl || getDocumentFileUrl(documentId);
    if (page && page > 0) {
      const withoutHash = base.split("#")[0];
      return `${withoutHash}#page=${page}`;
    }
    return base;
  }, [documentId, fileUrl, page]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-muted/30",
        className
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-3">
        <span className="text-sm font-medium text-muted-foreground">
          {page ? `Page ${page}` : "PDF"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-xs text-muted-foreground">
            {zoom}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </div>

      <PdfFrame key={src} src={src} zoom={zoom} />
    </div>
  );
}

function PdfFrame({ src, zoom }: { src: string; zoom: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative min-h-0 flex-1 overflow-auto">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading PDF...
          </div>
        </div>
      )}
      {error ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Unable to load the PDF. Make sure the backend is serving the file.
        </div>
      ) : (
        <iframe
          title="PDF viewer"
          src={src}
          className="h-full w-full border-0 origin-top-left transition-transform"
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            width: zoom !== 100 ? `${10000 / zoom}%` : "100%",
            height: zoom !== 100 ? `${10000 / zoom}%` : "100%",
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}
