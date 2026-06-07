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
  const confirmLabel = mode === "restore" ? "Restore" : "Re-run";
  const title =
    mode === "restore" ? "Restore to here" : "Re-run from this message?";
  const description =
    mode === "restore"
      ? `Restore the file to this point and remove the ${count} ${plural} after it.`
      : `This deletes the ${count} ${plural} below. The file reverts to this point.`;

  return (
    <Panel
      role="alertdialog"
      aria-label="Confirm rollback"
      onClose={onCancel}
      className="border-white/[0.08] bg-sidebar-accent"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 fill-warning text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm">{title}</p>
          <p
            className="mt-0.5 text-xs leading-snug text-muted-foreground"
            aria-live="polite"
          >
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <Button ref={cancelRef} variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="secondary" size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Panel>
  );
}
