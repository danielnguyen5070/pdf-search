"use client";

import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage as ChatMessageType } from "@/types/api";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  hasDocument: boolean;
}

export function ChatMessageList({
  messages,
  hasDocument,
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
        <h3 className="text-base font-medium tracking-tight">
          {hasDocument
            ? "Ask a question"
            : "Select a document and ask a question"}
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {hasDocument
            ? "Your conversation will appear here. Chat API is not connected yet."
            : "Choose a PDF from the sidebar to start chatting."}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
