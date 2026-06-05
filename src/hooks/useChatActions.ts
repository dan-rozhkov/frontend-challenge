import { useCallback, useRef } from "react";
import {
  getToolDisplayName,
  getToolTarget,
  rollbackToMessage,
  sendMessage,
  stopAgent,
} from "@/services/mock-backend";
import { useChatStore } from "@/stores/chat-store";
import type { ChatMessage } from "@/types/chat";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  // Controller for the in-flight rollback, so the loader can cancel the ~5s wait.
  const rollbackControllerRef = useRef<AbortController | null>(null);

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
      if (error instanceof DOMException && error.name === "AbortError") {
        useChatStore.getState().addMessage({
          id: generateId(),
          type: "error",
          message: "Agent stopped by user",
          timestamp: new Date().toISOString(),
        });
      } else {
        useChatStore.getState().addMessage({
          id: generateId(),
          type: "error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: new Date().toISOString(),
        });
      }
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

      /**
       * INTENTIONAL BUG: No loading indicator shown immediately after sending.
       * User has no feedback that agent is working for up to 1-5 seconds.
       * This is a known issue for candidates to identify.
       */
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

    try {
      await stopAgent();
    } catch {
      // Ignore stop errors
    }
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

      // Show the loader immediately, before any await, so there is no flash.
      store.setRollingBack(messageId);

      // Concurrency: if the agent is mid-stream, interrupt it before rolling back.
      if (store.isAgentWorking && store.abortController) {
        store.abortController.abort();
        try {
          await stopAgent();
        } catch {
          // Ignore stop errors
        }
      }

      const controller = new AbortController();
      rollbackControllerRef.current = controller;

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
        useChatStore.getState().addMessage({
          id: generateId(),
          type: "error",
          message: error instanceof Error ? error.message : "Rollback failed",
          timestamp: new Date().toISOString(),
        });
        return false;
      } finally {
        rollbackControllerRef.current = null;
      }
    },
    [runAgent],
  );

  /** Abort the in-flight rollback (the loader's Cancel). */
  const cancelRollback = useCallback(() => {
    rollbackControllerRef.current?.abort();
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
  };
}
