import { Button, Panel } from "@/components/ui";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

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

  const plural = count === 1 ? "message" : "messages";
  const confirmLabel = mode === "restore" ? "Restore" : "Save & re-run";
  const description =
    mode === "restore"
      ? `Restore the file to this point and remove the ${count} ${plural} after it.`
      : `Re-run from here. This removes the ${count} ${plural} after this one.`;

  return (
    <Panel
      role="alertdialog"
      aria-label="Confirm rollback"
      onClose={onCancel}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning/90" />
        <p className="text-xs leading-snug text-muted-foreground" aria-live="polite">
          {description}
        </p>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <Button ref={cancelRef} variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="warning"
          size="sm"
          onClick={onConfirm}
          className="font-medium"
        >
          {confirmLabel}
        </Button>
      </div>
    </Panel>
  );
}
