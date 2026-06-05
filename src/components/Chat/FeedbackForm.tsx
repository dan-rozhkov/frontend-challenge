import { cn } from "@/lib/utils";
import { Button, Textarea } from "@/components/ui";
import { useChatStore } from "@/stores/chat-store";
import type { MessageFeedback } from "@/types/chat";
import { Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useCallback, useState } from "react";

interface FeedbackFormProps {
  messageId: string;
  currentFeedback?: MessageFeedback;
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

  if (currentFeedback && !showInput) {
    return (
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs text-muted-foreground">Feedback:</span>
        {currentFeedback === "positive" ? (
          <ThumbsUp className="h-3 w-3 text-success" />
        ) : (
          <ThumbsDown className="h-3 w-3 text-destructive" />
        )}
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="mt-2 p-2 bg-muted/30 rounded-lg max-w-56">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {selectedRating === "positive" ? (
              <ThumbsUp className="h-3 w-3 text-success" />
            ) : (
              <ThumbsDown className="h-3 w-3 text-destructive" />
            )}
            <span>Add feedback</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded p-0.5"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What could be better?"
            rows={2}
            className="flex-1 rounded-md border bg-background px-2 py-1 focus:ring-1 focus:ring-ring"
          />
          <Button
            variant="primary"
            size="icon"
            onClick={handleSubmitWithText}
            className="self-start p-1.5"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex gap-1 mt-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedRating("positive")}
            className={cn(
              "flex-1 gap-1 rounded-md text-xs",
              selectedRating === "positive" &&
                "bg-success/20 text-success hover:bg-success/20 hover:text-success",
            )}
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedRating("negative")}
            className={cn(
              "flex-1 gap-1 rounded-md text-xs",
              selectedRating === "negative" &&
                "bg-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive",
            )}
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleQuickFeedback("positive")}
        className="rounded hover:text-success"
        title="Good response"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleQuickFeedback("negative")}
        className="rounded hover:text-destructive"
        title="Bad response"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
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
