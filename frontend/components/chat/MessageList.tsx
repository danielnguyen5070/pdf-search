"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage as ChatMessageType, Source } from "@/types/api";

interface MessageListProps {
  messages: ChatMessageType[];
  onSourceClick?: (source: Source) => void;
}

export function MessageList({ messages, onSourceClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h3 className="text-base font-medium">Ask about this PDF</h3>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Ask a question and get answers grounded in the document, with page
          sources.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 px-4 py-4">
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
