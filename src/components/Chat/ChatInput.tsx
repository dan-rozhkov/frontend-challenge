import { Button, Textarea } from "@/components/ui";
import { ArrowUp, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";

const MIN_LINES = 2;
const MAX_LINES = 8;

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  isAgentWorking?: boolean;
  onInterrupt?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  isAgentWorking = false,
  onInterrupt,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [metrics, setMetrics] = useState({ lineHeight: 20, padding: 8 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const computed = window.getComputedStyle(textareaRef.current);
      const lh = parseFloat(computed.lineHeight) || 20;
      const pt = parseFloat(computed.paddingTop) || 0;
      const pb = parseFloat(computed.paddingBottom) || 0;
      setMetrics({ lineHeight: lh, padding: pt + pb });
    }
  }, []);

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  const minHeight = MIN_LINES * metrics.lineHeight + metrics.padding;
  const maxHeight = MAX_LINES * metrics.lineHeight + metrics.padding;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isAgentWorking) return;

    onSubmit(trimmed);
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, isAgentWorking, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [maxHeight]);

  const canSend = !disabled && !isAgentWorking && value.trim().length > 0;
  const canInterrupt = isAgentWorking && onInterrupt;

  const effectivePlaceholder = placeholder;

  const focusTextarea = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      // Let clicks on interactive elements (the Send/Stop button) behave normally.
      if ((e.target as HTMLElement).closest("button, a, [role='button']")) return;
      // Don't steal focus / clear a selection the user is making inside the textarea.
      if (e.target === textareaRef.current) return;
      e.preventDefault();
      textareaRef.current?.focus();
    },
    [],
  );

  return (
    <div className="mb-3 mx-3 relative">
      <div
        onMouseDown={focusTextarea}
        className="flex flex-col border border-input-border bg-secondary rounded-lg focus-within:border-input-border-focus transition-colors cursor-text"
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={effectivePlaceholder}
          style={{ minHeight }}
          disabled={disabled}
          className="px-2 pt-2 pb-2"
        />
        <div className="flex items-center justify-end px-2 pb-2 gap-2">
          {canInterrupt ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onInterrupt}
              className="bg-accent-hover text-foreground hover:bg-accent-hover"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              variant="primary"
              size="icon"
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
