"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourceList } from "@/components/chat/SourceList";
import { ThinkingIndicator } from "@/components/shared/LoadingState";
import type { ChatMessage as ChatMessageType, Source } from "@/types/api";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick?: (source: Source) => void;
}

export function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const showThinking = message.isLoading && !message.content;

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/60 text-foreground rounded-bl-md border border-border/60"
        )}
      >
        {showThinking ? (
          <ThinkingIndicator />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-1">
            {message.isError ? (
              <p className="text-destructive">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-code:rounded prose-code:bg-background/60 prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {message.isLoading ? (
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-foreground/50 align-middle" />
                ) : null}
              </div>
            )}
            {message.sources && message.sources.length > 0 && (
              <SourceList
                sources={message.sources}
                onSourceClick={onSourceClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
