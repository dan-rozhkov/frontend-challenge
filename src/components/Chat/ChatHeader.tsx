import { Bot, RotateCcw } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { Button } from "@/components/ui";
import { useCallback } from "react";

export function ChatHeader() {
  const clearMessages = useChatStore((s) => s.clearMessages);
  const messagesCount = useChatStore((s) => s.messages.length);

  const handleNewChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-brand" />
        <span className="text-sm font-semibold text-sidebar-foreground">
          AI Coding Agent
        </span>
      </div>
      {messagesCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="rounded px-2 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Chat
        </Button>
      )}
    </div>
  );
}
