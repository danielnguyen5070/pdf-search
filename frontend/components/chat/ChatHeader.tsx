"use client";

import type { ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import type { Document } from "@/types/api";

interface ChatHeaderProps {
  document: Document | null;
  actions?: ReactNode;
}

export function ChatHeader({ document, actions }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
      <div className="flex min-w-0 items-center gap-2">
        <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            {document ? document.filename : "Chat"}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {document
              ? "Ask questions about this document"
              : "Chat with your documents"}
          </p>
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
