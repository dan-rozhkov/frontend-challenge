import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

interface RollbackConfirmProps {
  /** How many messages after the target will be dropped. */
  count: number;
  mode: "restore" | "edit";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Inline confirmation for a destructive rollback. Both Restore and Edit-resend
 * truncate the conversation, so we surface how many messages get dropped before
 * committing. Focus lands on Cancel (the safe choice) and Escape cancels.
 */
export function RollbackConfirm({
  count,
  mode,
  onConfirm,
  onCancel,
}: RollbackConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const plural = count === 1 ? "message" : "messages";
  const confirmLabel = mode === "restore" ? "Restore" : "Save & re-run";
  const description =
    mode === "restore"
      ? `Restore the file to this point and remove the ${count} ${plural} after it.`
      : `Re-run from here. This removes the ${count} ${plural} after this one.`;

  return (
    <div
      role="alertdialog"
      aria-label="Confirm rollback"
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2.5"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning/90" />
        <p className="text-xs leading-snug text-muted-foreground" aria-live="polite">
          {description}
        </p>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <button
          ref={cancelRef}
          onClick={onCancel}
          className="rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            "bg-warning/15 text-warning hover:bg-warning/25",
            "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
