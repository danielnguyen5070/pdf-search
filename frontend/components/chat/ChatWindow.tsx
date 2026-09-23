"use client";

import { useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { useChat } from "@/hooks/use-documents";
import { createMessageId } from "@/lib/utils-app";
import type { ChatMessage } from "@/types/api";

interface ChatWindowProps {
  documentId: string;
  onSourceClick?: (pageNumber: number) => void;
}

export function ChatWindow({ documentId, onSourceClick }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chat = useChat();

  const handleSubmit = async (content: string) => {
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
    };

    const loadingId = createMessageId();
    const loadingMessage: ChatMessage = {
      id: loadingId,
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);

    try {
      const response = await chat.mutateAsync({
        documentId,
        message: content,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content: response.answer,
                sources: response.sources,
              }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content:
                  "Something went wrong while processing your question. Please try again.",
                isError: true,
              }
            : msg
        )
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-border px-4">
        <h2 className="text-sm font-medium">Chat</h2>
      </div>
      <div className="min-h-0 flex-1">
        <MessageList messages={messages} onSourceClick={onSourceClick} />
      </div>
      <ChatInput onSubmit={handleSubmit} disabled={chat.isPending} />
    </div>
  );
}
