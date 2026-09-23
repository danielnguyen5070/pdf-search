"use client";

import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage as ChatMessageType, Source } from "@/types/api";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  allDocuments?: boolean;
  documentName?: string | null;
  onSourceClick?: (source: Source) => void;
}

export function ChatMessageList({
  messages,
  allDocuments = false,
  documentName = null,
  onSourceClick,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
          <MessageSquareText className="size-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium tracking-tight">Ask a question</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {allDocuments
            ? "Your conversation will search across all uploaded PDFs."
            : documentName
              ? `Ask anything about ${documentName}.`
              : "Choose a PDF from the sidebar or stay on All Documents."}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onSourceClick={onSourceClick}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
