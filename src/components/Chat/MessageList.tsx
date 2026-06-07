import { ScrollArea } from "@/components/ui/scroll-area";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import type {
  AgentTextMessage,
  ChatMessage,
  ToolOperationMessage as ToolOperationMessageType,
} from "@/types/chat";
import { useCallback, useEffect, useRef } from "react";
import { AgentMessage } from "./AgentMessage";
import { FeedbackForm } from "./FeedbackForm";
import { ToolOperationMessage } from "./ToolOperationMessage";
import { UserMessage } from "./UserMessage";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import { WorkingIndicator } from "./WorkingIndicator";

interface MessageListProps {
  messages: ChatMessage[];
  isAgentWorking?: boolean;
}

function isToolCallMessage(message: ChatMessage): boolean {
  return message.type === "tool_operation";
}

/**
 * IDs of the agent_message that *closes* each completed turn — the only place a
 * feedback control belongs. A "turn" is the run of agent activity between two
 * user messages; a single turn yields several text + tool messages, so we tag
 * only its last agent_message. That way thumbs appear once per response instead
 * of after every chunk. The still-streaming final turn is excluded while the
 * agent is working, since more text may yet arrive.
 */
function feedbackTargetIds(
  messages: ChatMessage[],
  isAgentWorking: boolean,
): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].type !== "agent_message") continue;

    let isLastOfTurn = true;
    let inLastTurn = true;
    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].type === "user") {
        inLastTurn = false;
        break;
      }
      if (messages[j].type === "agent_message") {
        isLastOfTurn = false;
        break;
      }
    }

    if (!isLastOfTurn) continue;
    // The current, in-progress turn gets no control until the agent stops.
    if (inLastTurn && isAgentWorking) continue;
    ids.add(messages[i].id);
  }
  return ids;
}

export function MessageList({
  messages,
  isAgentWorking = false,
}: MessageListProps) {
  const {
    setContainer,
    hasUnseenMessages,
    scrollToBottom,
    onContentAdded,
    onUserMessageSent,
  } = useAutoScroll({ threshold: 100 });

  const prevMessageCountRef = useRef(messages.length);

  const scrollAreaRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        requestAnimationFrame(() => {
          const viewport = node.querySelector(
            "[data-radix-scroll-area-viewport]",
          ) as HTMLElement | null;
          if (viewport) {
            setContainer(viewport);
          }
        });
      }
    },
    [setContainer],
  );

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;

    if (currentCount > prevCount) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.type === "user") {
        onUserMessageSent();
      } else {
        onContentAdded();
      }
    }

    prevMessageCountRef.current = currentCount;
  }, [messages.length, onContentAdded, onUserMessageSent]);

  useEffect(() => {
    if (isAgentWorking) {
      onContentAdded();
    }
  }, [isAgentWorking, onContentAdded]);

  const feedbackTargets = feedbackTargetIds(messages, isAgentWorking);

  const renderMessage = (message: ChatMessage) => {
    switch (message.type) {
      case "tool_operation": {
        const toolMsg = message as ToolOperationMessageType;
        return (
          <div className="mx-3 min-w-0 overflow-hidden">
            <ToolOperationMessage
              displayName={toolMsg.displayName}
              target={toolMsg.target}
              status={toolMsg.status}
              description={toolMsg.description}
              args={toolMsg.args}
              result={toolMsg.result}
            />
          </div>
        );
      }
      case "agent_message": {
        const agentMsg = message as AgentTextMessage;
        return (
          <div className="mx-3 min-w-0 overflow-hidden">
            <AgentMessage message={agentMsg} />
            {feedbackTargets.has(message.id) && (
              <FeedbackForm
                messageId={message.id}
                currentFeedback={agentMsg.feedback}
              />
            )}
          </div>
        );
      }
      case "user":
        return <UserMessage message={message} />;
      default:
        return null;
    }
  };

  // Render a turn's body (everything after its user message), grouping
  // consecutive tool operations into a single collapsible block.
  const renderBody = (bodyMessages: ChatMessage[]) => {
    const elements: React.ReactNode[] = [];
    let toolCallGroup: ChatMessage[] = [];

    const flushToolCallGroup = () => {
      if (toolCallGroup.length > 0) {
        const group = toolCallGroup;
        elements.push(
          <div key={`tool-group-${group[0].id}`} className="space-y-2 min-w-0">
            {group.map((msg) => (
              <div key={msg.id} id={`message-${msg.id}`}>
                {renderMessage(msg)}
              </div>
            ))}
          </div>,
        );
        toolCallGroup = [];
      }
    };

    for (const message of bodyMessages) {
      // Errors are surfaced at the composer (see App → ComposerErrors), not here.
      if (message.type === "error") continue;

      if (isToolCallMessage(message)) {
        toolCallGroup.push(message);
        continue;
      }

      flushToolCallGroup();
      elements.push(
        <div key={message.id} id={`message-${message.id}`} className="min-w-0">
          {renderMessage(message)}
        </div>,
      );
    }

    flushToolCallGroup();
    return elements;
  };

  // Split the flat message list into turns. A turn is a user message (its
  // sticky header) plus every agent/tool/error message that follows it, up to
  // the next user message. Messages before the first user message (e.g. an
  // opening agent greeting) form a leading turn with no header.
  type Turn = { key: string; header: ChatMessage | null; body: ChatMessage[] };
  const buildTurns = (): Turn[] => {
    const turns: Turn[] = [];
    let current: Turn | null = null;
    for (const message of messages) {
      if (message.type === "user") {
        if (current) turns.push(current);
        current = { key: message.id, header: message, body: [] };
      } else {
        if (!current) {
          current = { key: `lead-${message.id}`, header: null, body: [] };
        }
        current.body.push(message);
      }
    }
    if (current) turns.push(current);
    return turns;
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 justify-center items-center p-4">
        <p className="text-muted-foreground text-sm text-center">
          Start a conversation...
        </p>
      </div>
    );
  }

  // Show the working indicator while the agent spins up or pauses between
  // steps, so there is always feedback. A running tool operation already has
  // its own shimmer, so skip the indicator in that case to avoid doubling up.
  const lastMessage = messages[messages.length - 1];
  const showWorkingIndicator =
    isAgentWorking &&
    !(
      lastMessage?.type === "tool_operation" &&
      lastMessage.status === "running"
    );

  return (
    <div className="relative flex-1 w-full min-w-0 min-h-0 flex flex-col overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 w-full min-w-0 min-h-0">
        <div className="px-3 pt-1 pb-40 flex flex-col min-w-0">
          {buildTurns().map((turn, index, turns) => {
            const isLastTurn = index === turns.length - 1;
            const showIndicatorHere = isLastTurn && showWorkingIndicator;
            return (
              <section
                key={turn.key}
                className="flex flex-col min-w-0 pt-3"
              >
                {turn.header && (
                  <div
                    id={`message-${turn.header.id}`}
                    className="min-w-0 mb-3"
                  >
                    {renderMessage(turn.header)}
                  </div>
                )}
                {(turn.body.length > 0 || showIndicatorHere) && (
                  <div className="space-y-3 min-w-0">
                    {renderBody(turn.body)}
                    {showIndicatorHere && (
                      <div className="mx-3 min-w-0">
                        <WorkingIndicator />
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </ScrollArea>
      <ScrollToBottomButton
        visible={hasUnseenMessages}
        onClick={scrollToBottom}
      />
    </div>
  );
}
