import { useCallback } from "react";
import {
  getToolDisplayName,
  getToolTarget,
  rollbackToMessage,
  sendMessage,
  stopAgent,
} from "@/services/mock-backend";
import { useChatStore } from "@/stores/chat-store";
import { generateId } from "@/lib/utils";
import type { ChatMessage, ErrorMessage, RetryAction } from "@/types/chat";

/** Build an inline error message for the chat stream. */
function errorMessage(message: string, retry?: RetryAction): ChatMessage {
  return {
    id: generateId(),
    type: "error",
    message,
    retry,
    timestamp: new Date().toISOString(),
  };
}

/** Stop the agent, ignoring failures from the mock stop endpoint. */
async function safeStopAgent(): Promise<void> {
  try {
    await stopAgent();
  } catch {
    // Ignore stop errors
  }
}

/**
 * Chat orchestration actions.
 *
 * `runAgent` is the agent-playback loop extracted from the old `handleSubmit`.
 * It reads `responseIndex` / `fileContent` from the store via `getState()` at
 * call time (not from a React closure) so it can be reused after a rollback has
 * already mutated those values — the resend then starts from the right point.
 */
export function useChatActions() {
  const runAgent = useCallback(async () => {
    const { setAbortController, setAgentWorking } = useChatStore.getState();

    const controller = new AbortController();
    setAbortController(controller);
    setAgentWorking(true);

    try {
      const generator = sendMessage(
        useChatStore.getState().responseIndex,
        useChatStore.getState().fileContent.length,
        false,
        controller.signal,
      );

      for await (const { response, fileContent, newIndex } of generator) {
        const store = useChatStore.getState();
        store.setResponseIndex(newIndex);

        if (response.type === "text") {
          const agentMessage: ChatMessage = {
            id: generateId(),
            type: "agent_message",
            content: response.content,
            timestamp: new Date().toISOString(),
          };
          store.addMessage(agentMessage);
        } else if (response.type === "tool_call") {
          const toolCallId = generateId();
          const toolMessage: ChatMessage = {
            id: generateId(),
            type: "tool_operation",
            toolCallId,
            toolName: response.tool,
            displayName: getToolDisplayName(response.tool),
            target: getToolTarget(response.tool, response.args),
            status: "running",
            args: response.args,
            timestamp: new Date().toISOString(),
            fileContent: fileContent,
          };
          store.addMessage(toolMessage);

          const toolDelay = response.tool === "run_test" ? 5000 : 300;
          await new Promise((resolve) => setTimeout(resolve, toolDelay));

          useChatStore
            .getState()
            .updateToolStatus(toolCallId, "completed", response.result);

          if (fileContent) {
            useChatStore.getState().updateFileContent(fileContent);
          }
        }
      }
    } catch (error) {
      const aborted =
        error instanceof DOMException && error.name === "AbortError";
      const message = aborted
        ? "Agent stopped by user"
        : error instanceof Error
          ? error.message
          : "Unknown error occurred";
      // A user-initiated stop isn't a failure, so it gets no Retry affordance.
      useChatStore
        .getState()
        .addMessage(errorMessage(message, aborted ? undefined : { kind: "agent" }));
    } finally {
      const store = useChatStore.getState();
      store.setAgentWorking(false);
      store.setAbortController(null);
    }
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: generateId(),
        type: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      useChatStore.getState().addMessage(userMessage);

      // `runAgent` flips `isAgentWorking` synchronously, and MessageList renders
      // a WorkingIndicator off that flag, so feedback is immediate after send.
      await runAgent();
    },
    [runAgent],
  );

  const handleInterrupt = useCallback(async () => {
    const { abortController } = useChatStore.getState();
    if (abortController) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      abortController.abort();
    }

    await safeStopAgent();
  }, []);

  /**
   * Single async path behind both features. Restore rewinds chat + file to the
   * target message; Edit does the same rewind, then replaces the message text
   * and resends. The file content is produced by the mock backend (the source
   * of truth), never reconstructed here. Resolves to `true` on success so the
   * caller can keep the edit draft alive when a rollback fails.
   */
  const runRollback = useCallback(
    async (
      messageId: string,
      options: { resendText?: string } = {},
    ): Promise<boolean> => {
      const store = useChatStore.getState();
      if (store.isRollingBack) return false;

      // Nothing after this message means there is nothing to roll back: no
      // history to truncate and no later edit_file to undo. Skip the backend
      // rollback (and its "Reverting…" loader + ~5s delay) entirely. An edit
      // here is just "replace the text and resend"; a bare restore is a no-op.
      const index = store.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return false;
      const hasMessagesAfter = index < store.messages.length - 1;
      if (!hasMessagesAfter) {
        if (options.resendText !== undefined) {
          // Interrupt any in-flight stream before replacing + resending.
          if (store.isAgentWorking && store.abortController) {
            store.abortController.abort();
            await safeStopAgent();
          }
          useChatStore
            .getState()
            .updateUserMessageContent(messageId, options.resendText);
          await runAgent();
        }
        return true;
      }

      // Show the loader immediately, before any await, so there is no flash.
      store.setRollingBack(messageId);

      // Concurrency: if the agent is mid-stream, interrupt it before rolling back.
      if (store.isAgentWorking && store.abortController) {
        store.abortController.abort();
        await safeStopAgent();
      }

      // The controller for the in-flight rollback lives in the store (not a
      // per-hook ref) so the loader's Cancel works regardless of which hook
      // instance started the rollback.
      const controller = new AbortController();
      useChatStore.getState().setRollbackController(controller);

      try {
        const { fileContent } = await rollbackToMessage(
          messageId,
          useChatStore.getState().messages,
          controller.signal,
        );

        useChatStore.getState().applyRollback(messageId, fileContent);

        if (options.resendText !== undefined) {
          useChatStore
            .getState()
            .updateUserMessageContent(messageId, options.resendText);
          // Drop the loader before resuming so the agent's own working state shows.
          useChatStore.getState().setRollingBack(null);
          await runAgent();
        } else {
          useChatStore.getState().setRollingBack(null);
        }
        return true;
      } catch (error) {
        useChatStore.getState().setRollingBack(null);

        if (error instanceof DOMException && error.name === "AbortError") {
          // Rollback aborted — leave state untouched, no error surfaced.
          return false;
        }
        // Surface the failure inline in the chat stream, consistent with the
        // agent. State is only mutated on success, so nothing is lost here.
        useChatStore.getState().addMessage(
          errorMessage(error instanceof Error ? error.message : "Rollback failed", {
            kind: "rollback",
            messageId,
            resendText: options.resendText,
          }),
        );
        return false;
      } finally {
        useChatStore.getState().setRollbackController(null);
      }
    },
    [runAgent],
  );

  /** Abort the in-flight rollback (the loader's Cancel). */
  const cancelRollback = useCallback(() => {
    useChatStore.getState().rollbackController?.abort();
  }, []);

  /** Dismiss a surfaced error and re-run the action that produced it. */
  const retryError = useCallback(
    (error: ErrorMessage) => {
      useChatStore.getState().removeMessage(error.id);
      const retry = error.retry;
      if (!retry) return;
      if (retry.kind === "agent") {
        void runAgent();
      } else {
        void runRollback(
          retry.messageId,
          retry.resendText !== undefined
            ? { resendText: retry.resendText }
            : {},
        );
      }
    },
    [runAgent, runRollback],
  );

  /** Dismiss a surfaced error without retrying. */
  const dismissError = useCallback((errorId: string) => {
    useChatStore.getState().removeMessage(errorId);
  }, []);

  const handleRestore = useCallback(
    (messageId: string) => runRollback(messageId),
    [runRollback],
  );

  const handleEditSubmit = useCallback(
    (messageId: string, text: string) =>
      runRollback(messageId, { resendText: text }),
    [runRollback],
  );

  return {
    runAgent,
    handleSubmit,
    handleInterrupt,
    runRollback,
    cancelRollback,
    handleRestore,
    handleEditSubmit,
    retryError,
    dismissError,
  };
}
