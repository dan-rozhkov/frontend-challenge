import type { ErrorMessage as ErrorMessageType } from "@/types/chat";
import { ErrorMessage } from "./ErrorMessage";

interface ComposerErrorsProps {
  errors: ErrorMessageType[];
}

/**
 * Error cards stacked directly above the composer (see `ChatInput`'s `banner`
 * slot), so a failure stays next to the next action instead of scrolling away
 * up in the message list. The cards keep their normal inline-card chrome.
 */
export function ComposerErrors({ errors }: ComposerErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 animate-error-in">
      {errors.map((error) => (
        <ErrorMessage key={error.id} message={error} />
      ))}
    </div>
  );
}
