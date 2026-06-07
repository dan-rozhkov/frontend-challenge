import {
  Button,
  Panel,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useChatStore } from "@/stores/chat-store";
import type { MessageFeedback } from "@/types/chat";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FeedbackFormProps {
  messageId: string;
  currentFeedback?: MessageFeedback;
}

const RATING_LABEL = {
  positive: "Good response",
  negative: "Bad response",
} as const;

/** A tooltipped thumb up/down toggle, shared by the quick row and the comment panel. */
function ThumbButton({
  rating,
  onClick,
  className,
  iconSize = "h-3 w-3",
}: {
  rating: "positive" | "negative";
  onClick: () => void;
  className?: string;
  iconSize?: string;
}) {
  const Icon = rating === "positive" ? ThumbsUp : ThumbsDown;
  const label = RATING_LABEL[rating];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          aria-label={label}
          className={className}
        >
          <Icon className={iconSize} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Inline feedback affordance for an agent message: quick thumbs, or expand to
 * add a comment. The comment field is a multi-line textarea (Enter submits,
 * Shift+Enter inserts a newline) so longer feedback is easy to type.
 */
export function FeedbackForm({
  messageId,
  currentFeedback,
}: FeedbackFormProps) {
  const [showInput, setShowInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedRating, setSelectedRating] = useState<MessageFeedback>(
    currentFeedback ?? null,
  );
  const setMessageFeedback = useChatStore((s) => s.setMessageFeedback);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showInput) textareaRef.current?.focus();
  }, [showInput]);

  const handleQuickFeedback = useCallback(
    (rating: MessageFeedback) => {
      setSelectedRating(rating);
      setMessageFeedback(messageId, rating);
    },
    [messageId, setMessageFeedback],
  );

  const handleShowInput = useCallback((rating: MessageFeedback) => {
    setSelectedRating(rating);
    setShowInput(true);
  }, []);

  const handleSubmitWithText = useCallback(() => {
    if (selectedRating) {
      setMessageFeedback(messageId, selectedRating, feedbackText || undefined);
      setShowInput(false);
      setFeedbackText("");
    }
  }, [messageId, selectedRating, feedbackText, setMessageFeedback]);

  const handleClose = useCallback(() => {
    setShowInput(false);
    setFeedbackText("");
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitWithText();
    }
  };

  // Selection is conveyed by brightness, not colour: the chosen thumb stays at
  // full opacity while the other fades back. With nothing chosen, both are full.
  const thumbTone = (rating: MessageFeedback) =>
    selectedRating && selectedRating !== rating
      ? "opacity-30 hover:opacity-60"
      : "opacity-100";

  if (showInput) {
    return (
      <Panel onClose={handleClose} animated={false} className="mt-2">
        <div className="rounded-lg border border-input-border bg-secondary focus-within:border-input-border-focus transition-colors">
          <Textarea
            ref={textareaRef}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What could be better?"
            rows={2}
            className="px-2 py-1.5"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ThumbButton
              rating="positive"
              onClick={() => setSelectedRating("positive")}
              className={thumbTone("positive")}
            />
            <ThumbButton
              rating="negative"
              onClick={() => setSelectedRating("negative")}
              className={thumbTone("negative")}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSubmitWithText}>
              Send
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-2">
      <ThumbButton
        rating="positive"
        onClick={() => handleQuickFeedback("positive")}
        className={thumbTone("positive")}
        iconSize="h-3.5 w-3.5"
      />
      <ThumbButton
        rating="negative"
        onClick={() => handleQuickFeedback("negative")}
        className={thumbTone("negative")}
        iconSize="h-3.5 w-3.5"
      />
      <Button
        variant="link"
        size="sm"
        onClick={() => handleShowInput("positive")}
        className="ml-1 px-0 py-0 hover:text-sidebar-foreground"
      >
        Add comment...
      </Button>
    </div>
  );
}
