export type ChatMessageType =
  | "tool_operation"
  | "agent_message"
  | "user"
  | "error";

interface ChatMessageBase {
  id: string;
  timestamp: string;
}

export type ToolOperationStatus = "running" | "completed" | "cancelled";

export type ToolName = "list_dir" | "read_file" | "edit_file" | "run_test";

export interface ToolOperationMessage extends ChatMessageBase {
  type: "tool_operation";
  toolCallId: string;
  toolName: ToolName;
  displayName: string;
  target: string;
  status: ToolOperationStatus;
  description?: string;
  args?: Record<string, unknown>;
  result?: string;
  fileContent?: string[];
}

export type MessageFeedback = "positive" | "negative" | null;

export interface AgentTextMessage extends ChatMessageBase {
  type: "agent_message";
  content: string;
  feedback?: MessageFeedback;
  feedbackText?: string;
}

export interface UserMessage extends ChatMessageBase {
  type: "user";
  content: string;
}

/** How a surfaced error can be retried, if at all. */
export type RetryAction =
  | { kind: "agent" }
  | { kind: "rollback"; messageId: string; resendText?: string };

export interface ErrorMessage extends ChatMessageBase {
  type: "error";
  /** Raw `CODE: detail` string from the backend; kept for logs, never shown as-is. */
  message: string;
  /** Present when the failed action can be re-run from the error card. */
  retry?: RetryAction;
}

export type ChatMessage =
  | ToolOperationMessage
  | AgentTextMessage
  | UserMessage
  | ErrorMessage;
