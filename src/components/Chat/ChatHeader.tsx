import { Bot, RotateCcw } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { Button } from "@/components/ui";
import { useCallback } from "react";

export function ChatHeader() {
  const clearMessages = useChatStore((s) => s.clearMessages);
  // Boolean, not the count: the "New Chat" button only cares whether the thread
  // is empty, so the header re-renders on the 0↔non-empty flip instead of on
  // every new message.
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  const handleNewChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return (
    <div className="flex items-center justify-between h-12 shrink-0 px-4 border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-brand" strokeWidth={1.75} />
        <span className="text-sm font-semibold text-sidebar-foreground">
          AI Coding Agent
        </span>
      </div>
      {hasMessages && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="px-2 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Chat
        </Button>
      )}
    </div>
  );
}
