"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = "Ask a question...",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="shrink-0 border-t border-border bg-background p-3 sm:p-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-xl border border-border bg-muted/20 p-2 focus-within:border-foreground/25 focus-within:ring-1 focus-within:ring-ring/30">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="min-h-[40px] max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="icon"
            className="size-9 shrink-0 rounded-lg"
            disabled={disabled || !value.trim()}
            onClick={handleSubmit}
            aria-label="Send message"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
          {disabled ? " · Select a document to chat" : ""}
        </p>
      </div>
    </div>
  );
}
