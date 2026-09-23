"use client";

import type { ReactNode } from "react";
import { Library, MessageSquare } from "lucide-react";
import type { Document } from "@/types/api";

interface ChatHeaderProps {
  document: Document | null;
  allDocuments?: boolean;
  actions?: ReactNode;
}

export function ChatHeader({
  document,
  allDocuments = false,
  actions,
}: ChatHeaderProps) {
  const Icon = allDocuments ? Library : MessageSquare;

  return (
    <header className="flex h-14 min-w-0 shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-border px-4">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            {allDocuments
              ? "All Documents"
              : document
                ? document.filename
                : "Chat"}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {allDocuments
              ? "Ask questions across every uploaded PDF"
              : document
                ? "Ask questions about this document"
                : "Chat with your documents"}
          </p>
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
