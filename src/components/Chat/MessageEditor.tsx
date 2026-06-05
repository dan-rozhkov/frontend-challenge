import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface MessageEditorProps {
  initialValue: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * Inline editor shown in place of a user message bubble while it is being
 * edited. Mirrors the composer affordances (Enter to submit, Shift+Enter for a
 * newline) and adds Escape to cancel. Auto-focuses with the cursor at the end.
 */
export function MessageEditor({
  initialValue,
  onSubmit,
  onCancel,
  disabled = false,
}: MessageEditorProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    resize(el);
  }, []);

  const canSave = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (canSave) onSubmit(value.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-input-border-focus bg-secondary p-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onInput={(e) => resize(e.currentTarget)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled}
        aria-label="Edit message"
        className={cn(
          "w-full resize-none bg-transparent text-sm leading-5 text-foreground",
          "max-h-40 overflow-y-auto placeholder:text-muted-foreground focus:outline-none",
        )}
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={onCancel}
          className="rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!canSave}
          className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          Save &amp; re-run
        </button>
      </div>
    </div>
  );
}
