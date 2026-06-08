import { useChatStore } from "@/stores/chat-store";
import type { ErrorMessage as ErrorMessageType } from "@/types/chat";
import { useShallow } from "zustand/react/shallow";
import { ErrorMessage } from "./ErrorMessage";

/**
 * Error cards stacked directly above the composer (see `ChatInput`'s `banner`
 * slot), so a failure stays next to the next action instead of scrolling away
 * up in the message list. The cards keep their normal inline-card chrome.
 *
 * Subscribes to the error set itself (via `useShallow`, so it only re-renders
 * when that set actually changes) rather than receiving it as a prop — this
 * keeps App from having to subscribe to `messages` just to feed the banner.
 */
export function ComposerErrors() {
  const errors = useChatStore(
    useShallow((s) =>
      s.messages.filter((m): m is ErrorMessageType => m.type === "error"),
    ),
  );

  if (errors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 animate-error-in">
      {errors.map((error) => (
        <ErrorMessage key={error.id} message={error} />
      ))}
    </div>
  );
}
