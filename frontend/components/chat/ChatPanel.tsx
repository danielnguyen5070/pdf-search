"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { createMessageId } from "@/lib/utils-app";
import type { ChatMessage, Document } from "@/types/api";

interface ChatPanelProps {
  document: Document | null;
  headerActions?: ReactNode;
}

export function ChatPanel({ document, headerActions }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Reset local messages when the selected document changes.
  useEffect(() => {
    setMessages([]);
  }, [document?.id]);

  const handleSubmit = (content: string) => {
    if (!document) return;

    // UI-only: no chat API yet — keep a local placeholder thread.
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content:
        "Chat is UI-only for now. Connect the chat API later to answer questions about this PDF.",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <ChatHeader document={document} actions={headerActions} />
      <div className="min-h-0 flex-1">
        <ChatMessageList
          messages={messages}
          hasDocument={Boolean(document)}
        />
      </div>
      <ChatInput
        onSubmit={handleSubmit}
        disabled={!document}
        placeholder={
          document
            ? "Ask a question..."
            : "Select a document to ask a question..."
        }
      />
    </section>
  );
}
