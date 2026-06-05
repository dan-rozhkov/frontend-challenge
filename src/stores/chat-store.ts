import { create } from "zustand";
import type {
  ChatMessage,
  MessageFeedback,
  ToolOperationStatus,
} from "@/types/chat";

interface ChatState {
  messages: ChatMessage[];
  fileContent: string[];
  isAgentWorking: boolean;
  abortController: AbortController | null;
  responseIndex: number;
  isRollingBack: boolean;
  rollbackTargetId: string | null;

  addMessage: (message: ChatMessage) => void;
  updateToolStatus: (
    toolCallId: string,
    status: ToolOperationStatus,
    result?: string,
  ) => void;
  updateFileContent: (content: string[]) => void;
  setAgentWorking: (working: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  setMessageFeedback: (
    messageId: string,
    feedback: MessageFeedback,
    feedbackText?: string,
  ) => void;
  setResponseIndex: (index: number) => void;
  clearMessages: () => void;
  setRollingBack: (messageId: string | null) => void;
  updateUserMessageContent: (messageId: string, content: string) => void;
  applyRollback: (messageId: string, fileContent: string[]) => void;
}

/**
 * Number of agent responses already consumed by the messages in `msgs`.
 *
 * The mock agent replays HARDCODED_RESPONSES by index, yielding exactly one
 * `agent_message` (text) or one `tool_operation` (tool_call) per response.
 * After a rollback truncates the history, `responseIndex` must equal the count
 * of those messages in the remaining slice, otherwise a resend would continue
 * from the wrong point.
 */
function countConsumedResponses(msgs: ChatMessage[]): number {
  return msgs.filter(
    (m) => m.type === "agent_message" || m.type === "tool_operation",
  ).length;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  fileContent: [],
  isAgentWorking: false,
  abortController: null,
  responseIndex: 0,
  isRollingBack: false,
  rollbackTargetId: null,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateToolStatus: (toolCallId, status, result) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.type === "tool_operation" && msg.toolCallId === toolCallId) {
          return { ...msg, status, result: result ?? msg.result };
        }
        return msg;
      }),
    }));
  },

  updateFileContent: (content) => {
    set({ fileContent: content });
  },

  setAgentWorking: (working) => {
    set({ isAgentWorking: working });
  },

  setAbortController: (controller) => {
    set({ abortController: controller });
  },

  setMessageFeedback: (messageId, feedback, feedbackText) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId && msg.type === "agent_message") {
          return { ...msg, feedback, feedbackText };
        }
        return msg;
      }),
    }));
  },

  setResponseIndex: (index) => {
    set({ responseIndex: index });
  },

  clearMessages: () => {
    set({
      messages: [],
      fileContent: [],
      responseIndex: 0,
      isRollingBack: false,
      rollbackTargetId: null,
    });
  },

  setRollingBack: (messageId) => {
    set({ isRollingBack: messageId !== null, rollbackTargetId: messageId });
  },

  updateUserMessageContent: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId && msg.type === "user" ? { ...msg, content } : msg,
      ),
    }));
  },

  /**
   * Pure state transaction for a rollback. The file content is supplied by the
   * caller (the async mock backend owns the rollback logic) so we never
   * reconstruct it by hand here. The truncation is INCLUSIVE: the target
   * message stays, everything after it is dropped. `responseIndex` is
   * recomputed from the remaining slice so a later resend continues correctly.
   */
  applyRollback: (messageId, fileContent) => {
    const { messages } = get();
    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    const newMessages = messages.slice(0, index + 1);

    set({
      messages: newMessages,
      fileContent,
      responseIndex: countConsumedResponses(newMessages),
    });
  },
}));
