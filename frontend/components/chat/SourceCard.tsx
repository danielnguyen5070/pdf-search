"use client";

import { FileText } from "lucide-react";
import type { Source } from "@/types/api";
import { cn } from "@/lib/utils";

interface SourceCardProps {
  source: Source;
  onClick?: (pageNumber: number) => void;
}

export function SourceCard({ source, onClick }: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(source.page)}
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors",
        onClick
          ? "hover:border-foreground/25 hover:bg-muted/40 cursor-pointer"
          : "cursor-default"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileText className="size-3.5 text-muted-foreground" />
        Page {source.page}
      </div>
      {source.content && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {source.content}
        </p>
      )}
    </button>
  );
}
