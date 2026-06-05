import type { ErrorMessage as ErrorMessageType } from "@/types/chat";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: ErrorMessageType;
}

/**
 * INTENTIONAL UX ISSUE: Error messages are displayed with technical details
 * instead of user-friendly messages. This is a known issue for candidates to identify.
 */
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-destructive mb-1">Error</p>
        <p className="text-sm text-destructive/90 break-words">{message.message}</p>
      </div>
    </div>
  );
}
