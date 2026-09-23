"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { streamChat } from "@/lib/api/chat";
import { createMessageId, getErrorMessage } from "@/lib/utils-app";
import type { ChatMessage, Document } from "@/types/api";

interface ChatPanelProps {
  document: Document | null;
  /** null = All Documents mode */
  selectedDocumentId: string | null;
  headerActions?: ReactNode;
}

export function ChatPanel({
  document,
  selectedDocumentId,
  headerActions,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Reset local messages when the chat scope changes.
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setIsSending(false);
  }, [selectedDocumentId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (content: string) => {
    if (isSending) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
    };
    const assistantId = createMessageId();
    const loadingMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(selectedDocumentId, content, {
        signal: controller.signal,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: msg.content + token,
                    isLoading: false,
                  }
                : msg
            )
          );
        },
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                isLoading: false,
                content:
                  msg.content.trim() ||
                  "I could not find an answer in the documents.",
              }
            : msg
        )
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                id: assistantId,
                role: "assistant",
                content: getErrorMessage(
                  err,
                  "Something went wrong while processing your question. Please try again."
                ),
                isError: true,
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsSending(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <ChatHeader
        document={document}
        allDocuments={selectedDocumentId === null}
        actions={headerActions}
      />
      <div className="min-h-0 flex-1">
        <ChatMessageList
          messages={messages}
          allDocuments={selectedDocumentId === null}
          documentName={document?.filename ?? null}
        />
      </div>
      <ChatInput
        onSubmit={handleSubmit}
        disabled={isSending}
        placeholder={
          selectedDocumentId === null
            ? "Ask across all documents..."
            : "Ask a question..."
        }
      />
    </section>
  );
}
