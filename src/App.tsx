import { ChatInput, ComposerErrors, MessageList } from "@/components/Chat";
import { ChatHeader } from "@/components/Chat/ChatHeader";
import { MockEditor } from "@/components/Editor";
import { TooltipProvider } from "@/components/ui";
import { useChatActions } from "@/hooks/useChatActions";
import { useChatStore } from "@/stores/chat-store";
import type { ErrorMessage } from "@/types/chat";

export default function App() {
  const messages = useChatStore((s) => s.messages);
  const isAgentWorking = useChatStore((s) => s.isAgentWorking);
  const isRollingBack = useChatStore((s) => s.isRollingBack);
  const { handleSubmit, handleInterrupt } = useChatActions();

  // Errors are lifted out of the scrolling list and pinned to the top of the
  // composer, where the next action happens — so a failure can't scroll away.
  const errors = messages.filter(
    (m): m is ErrorMessage => m.type === "error",
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen flex">
        {/*
          Chat panel - 30% width, but never collapses below a usable minimum.
          The editor (flex-1 min-w-0) absorbs the shrinking on narrow viewports.
        */}
        <div className="w-[30%] min-w-[320px] flex flex-col bg-sidebar border-r border-sidebar-border">
          <ChatHeader />
          <MessageList messages={messages} isAgentWorking={isAgentWorking} />
          <ChatInput
            onSubmit={handleSubmit}
            isAgentWorking={isAgentWorking}
            onInterrupt={handleInterrupt}
            disabled={isRollingBack}
            placeholder={
              isRollingBack
                ? "Reverting…"
                : isAgentWorking
                  ? "Agent is working…"
                  : undefined
            }
            banner={
              errors.length > 0 ? <ComposerErrors errors={errors} /> : undefined
            }
          />
        </div>

        {/*
          Editor panel - takes the remaining space and is allowed to shrink
          (min-w-0) so it gives way before the chat panel does.
        */}
        <div className="flex-1 min-w-0 bg-background">
          <MockEditor />
        </div>
      </div>
    </TooltipProvider>
  );
}
