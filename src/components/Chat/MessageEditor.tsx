import { Button, Panel, Textarea } from "@/components/ui";
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
    }
  };

  return (
    <Panel
      onClose={onCancel}
      animated={false}
      className="border-input-border-focus bg-secondary p-2"
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onInput={(e) => resize(e.currentTarget)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled}
        aria-label="Edit message"
        className="max-h-40 overflow-y-auto"
      />
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={submit}
          disabled={!canSave}
        >
          Save &amp; re-run
        </Button>
      </div>
    </Panel>
  );
}
