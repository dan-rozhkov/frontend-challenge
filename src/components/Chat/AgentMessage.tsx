import type { AgentTextMessage } from "@/types/chat";
import { memo } from "react";
import { Markdown } from "./Markdown";

interface AgentMessageProps {
  message: AgentTextMessage;
}

// Memoized: the message object keeps a stable identity while unchanged (the
// store spreads only the mutated message), so this skips re-rendering on every
// agent tick.
export const AgentMessage = memo(function AgentMessage({
  message,
}: AgentMessageProps) {
  return (
    <div className="min-w-0">
      <Markdown
        content={message.content}
        className="text-sidebar-foreground text-sm"
      />
    </div>
  );
});
