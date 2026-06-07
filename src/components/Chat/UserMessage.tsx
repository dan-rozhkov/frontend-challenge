import { cn } from "@/lib/utils";
import { useChatActions } from "@/hooks/useChatActions";
import { useChatStore } from "@/stores/chat-store";
import type { UserMessage as UserMessageType } from "@/types/chat";
import {
  Button,
  ShimmerText,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { Pencil, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MessageEditor } from "./MessageEditor";
import { RollbackConfirm } from "./RollbackConfirm";
import { FadeOverlay } from "./FadeOverlay";

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

  // Short messages (≤2 lines) leave room below, so the confirmation reads best
  // pinned to the top; tall ones would be covered, so it drops to the bottom.
  // Measured from the rendered bubble — re-measured on resize since the panel
  // can be narrowed and rewrap the text.
  const [textEl, setTextEl] = useState<HTMLSpanElement | null>(null);
  const [anchor, setAnchor] = useState<"top" | "bottom">("top");
  useEffect(() => {
    if (!textEl) return;
    const measure = () => {
      const cs = getComputedStyle(textEl);
      const lineHeight =
        parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
      const lines = Math.round(textEl.scrollHeight / lineHeight);
      setAnchor(lines <= 2 ? "top" : "bottom");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(textEl);
    return () => ro.disconnect();
  }, [textEl, message.content]);

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
      <div className="rounded-lg bg-sidebar-accent px-3 py-1.5">
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

  // The idle bubble and the inline editor are the two "base" states. The
  // destructive confirmation floats *over* whichever is showing, as a shadowed
  // popover, rather than replacing it.
  return (
    <div className="relative">
      {/* While the confirmation popover floats over the message, the base
          recedes — scales down and fades — so the popover reads as the
          foreground layer. */}
      <div
        className={cn(
          "transition-all duration-200",
          confirm && "scale-[0.98] opacity-60",
        )}
      >
        {isEditing ? (
          <MessageEditor
            initialValue={draft}
            onSubmit={submitEdit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="rounded-lg bg-sidebar-accent px-3 pt-1.5 pb-2">
          <div className="flex items-end justify-between gap-2">
            <span
              ref={setTextEl}
              onDoubleClick={() => {
                if (!isRollingBack) startEdit();
              }}
              className="min-w-0 flex-1 text-sm whitespace-pre-wrap text-sidebar-foreground"
            >
              {message.content}
            </span>
            <div className="-mr-1.5 flex shrink-0 items-center gap-1">
              {affectedCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirm("restore")}
                      disabled={isRollingBack}
                      aria-label="Restore to here"
                      className={ACTION_BUTTON}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Restore chat and file to this point
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startEdit}
                    disabled={isRollingBack}
                    aria-label="Edit message"
                    className={ACTION_BUTTON}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                  <TooltipContent>Edit message</TooltipContent>
              </Tooltip>
            </div>
          </div>
          </div>
        )}
      </div>

      {confirm && (
        <div
          className={cn(
            "absolute inset-x-0 z-40",
            anchor === "top" ? "top-0" : "bottom-0",
          )}
        >
          {/* Soft fade between the message and the popover so it dissolves in
              instead of hitting a hard edge — below it when pinned to the top,
              above it when pinned to the bottom. */}
          {anchor === "bottom" && <FadeOverlay direction="up" />}
          <RollbackConfirm
            count={affectedCount}
            mode={confirm}
            onConfirm={handleConfirm}
            onCancel={() => setConfirm(null)}
          />
          {anchor === "top" && <FadeOverlay direction="down" />}
        </div>
      )}
    </div>
  );
}
