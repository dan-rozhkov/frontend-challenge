import { cn } from "@/lib/utils";
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
import { ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
      <Panel onClose={handleClose} className="mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {selectedRating === "positive" ? (
              <ThumbsUp className="h-3 w-3 text-success" />
            ) : (
              <ThumbsDown className="h-3 w-3 text-destructive" />
            )}
            <span>Add feedback</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label="Close"
                className="p-0.5"
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRating("positive")}
                  aria-label="Good response"
                  className={cn(
                    selectedRating === "positive" &&
                      "bg-success/20 text-success hover:bg-success/20 hover:text-success",
                  )}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Good response</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRating("negative")}
                  aria-label="Bad response"
                  className={cn(
                    selectedRating === "negative" &&
                      "bg-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive",
                  )}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bad response</TooltipContent>
            </Tooltip>
          </div>
          <Button variant="primary" size="sm" onClick={handleSubmitWithText}>
            Send
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleQuickFeedback("positive")}
            aria-label="Good response"
            className="hover:text-success"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Good response</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleQuickFeedback("negative")}
            aria-label="Bad response"
            className="hover:text-destructive"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bad response</TooltipContent>
      </Tooltip>
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
