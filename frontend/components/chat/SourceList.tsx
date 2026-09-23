"use client";

import { SourceCard } from "@/components/chat/SourceCard";
import type { Source } from "@/types/api";

interface SourceListProps {
  sources: Source[];
  onSourceClick?: (pageNumber: number) => void;
}

export function SourceList({ sources, onSourceClick }: SourceListProps) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Sources
      </p>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <SourceCard
            key={`${source.page}-${index}`}
            source={source}
            onClick={onSourceClick}
          />
        ))}
      </div>
    </div>
  );
}
