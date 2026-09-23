"use client";

import { FileText } from "lucide-react";
import type { Source } from "@/types/api";
import { cn } from "@/lib/utils";

interface SourceCardProps {
  source: Source;
  onClick?: (source: Source) => void;
}

export function SourceCard({ source, onClick }: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(source)}
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors",
        onClick
          ? "cursor-pointer hover:border-foreground/25 hover:bg-muted/40"
          : "cursor-default"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {source.filename || "document.pdf"}
          {source.page > 0 ? ` · Page ${source.page}` : ""}
        </span>
      </div>
      {source.content && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {source.content}
        </p>
      )}
    </button>
  );
}
