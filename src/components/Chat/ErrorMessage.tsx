import { Button, Panel } from "@/components/ui";
import { useChatActions } from "@/hooks/useChatActions";
import { describeError } from "@/lib/error-messages";
import type { ErrorMessage as ErrorMessageType } from "@/types/chat";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorMessageProps {
  message: ErrorMessageType;
}

/**
 * Inline error card. Shares the neutral `Panel` chrome with the other inline
 * cards (rollback-confirm, feedback) — only the icon and title carry the
 * destructive accent. The raw `CODE: detail` string is never shown; it is
 * translated to friendly copy via `describeError`. When the failed action is
 * retryable, a Retry button re-runs it; Dismiss clears the card.
 */
export function ErrorMessage({ message }: ErrorMessageProps) {
  const { retryError, dismissError } = useChatActions();
  const { title, description } = describeError(message.message);
  const canRetry = message.retry !== undefined;

  return (
    <Panel role="alert">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-destructive">{title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dismissError(message.id)}
        >
          Dismiss
        </Button>
        {canRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => retryError(message)}
            className="font-medium"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    </Panel>
  );
}
