import { useChatActions } from "@/hooks/useChatActions";
import { useChatStore } from "@/stores/chat-store";
import type { UserMessage as UserMessageType } from "@/types/chat";
import { Button, ShimmerText } from "@/components/ui";
import { Pencil, RotateCcw } from "lucide-react";
import { useState } from "react";
import { MessageEditor } from "./MessageEditor";
import { RollbackConfirm } from "./RollbackConfirm";

interface UserMessageProps {
  message: UserMessageType;
}

type Confirm = "restore" | "edit" | null;

// Extras on top of the ghost/icon Button, matching the feedback thumbs: just a
// hover tint plus a softer disabled fade. Radius and sizing are inherited from
// the Button component; the row's reveal is handled by the container.
const ACTION_BUTTON =
  "hover:text-sidebar-foreground disabled:opacity-40";

/**
 * A user message doubles as a checkpoint: hovering reveals Edit and
 * "Restore to here". Both run through one async rollback. Edit, confirm, and
 * the in-flight loader are local view states; the actual mutation lives in
 * `useChatActions`. The edit draft is kept locally so a failed rollback can
 * reopen the editor without losing the typed text.
 */
export function UserMessage({ message }: UserMessageProps) {
  const { handleRestore, handleEditSubmit, cancelRollback } = useChatActions();
  const messages = useChatStore((s) => s.messages);
  const isRollingBack = useChatStore((s) => s.isRollingBack);
  const rollbackTargetId = useChatStore((s) => s.rollbackTargetId);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const index = messages.findIndex((m) => m.id === message.id);
  const affectedCount = index === -1 ? 0 : messages.length - (index + 1);
  const isReverting = rollbackTargetId === message.id;

  const startEdit = () => {
    setDraft(message.content);
    setIsEditing(true);
  };

  const submitEdit = async (text: string) => {
    setDraft(text);
    if (affectedCount > 0) {
      setConfirm("edit");
      return;
    }
    setIsEditing(false);
    const ok = await handleEditSubmit(message.id, text);
    if (!ok) setIsEditing(true);
  };

  const confirmEdit = async () => {
    setConfirm(null);
    setIsEditing(false);
    const ok = await handleEditSubmit(message.id, draft);
    if (!ok) setIsEditing(true);
  };

  const handleConfirm = () => {
    if (confirm === "restore") {
      setConfirm(null);
      handleRestore(message.id);
    } else {
      confirmEdit();
    }
  };

  // --- In-flight: this message is being rolled back ---
  if (isReverting) {
    return (
      <div className="rounded-lg border border-border bg-sidebar-accent px-3 py-1.5">
        <span className="block text-sm whitespace-pre-wrap text-sidebar-foreground/40">
          {isEditing ? draft : message.content}
        </span>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="text-xs" aria-live="polite">
            <ShimmerText>Reverting… (~5s)</ShimmerText>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRollback}
            className="px-1.5 py-0.5 hover:text-sidebar-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --- Destructive confirmation ---
  if (confirm) {
    return (
      <RollbackConfirm
        count={affectedCount}
        mode={confirm}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    );
  }

  // --- Inline edit ---
  if (isEditing) {
    return (
      <MessageEditor
        initialValue={draft}
        onSubmit={submitEdit}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // --- Idle bubble with the actions pinned bottom-left inside the bubble,
  // styled like the feedback thumbs under agent messages. ---
  return (
    <div className="rounded-lg border border-border bg-sidebar-accent px-3 py-1.5">
      <span className="text-sm whitespace-pre-wrap text-sidebar-foreground">
        {message.content}
      </span>
      <div className="mt-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={startEdit}
          disabled={isRollingBack}
          aria-label="Edit message"
          title="Edit message"
          className={ACTION_BUTTON}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {affectedCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirm("restore")}
            disabled={isRollingBack}
            aria-label="Restore to here"
            title="Restore chat and file to this point"
            className={ACTION_BUTTON}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
