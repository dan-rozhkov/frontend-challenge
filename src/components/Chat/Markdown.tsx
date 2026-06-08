import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

// Memoized: react-markdown re-parses the content on every render, which is the
// single most expensive thing in the message list. Props are primitives, so the
// default shallow comparison keeps unchanged messages from re-parsing on every
// agent tick.
export const Markdown = memo(function Markdown({
  content,
  className,
}: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none",
        "prose-p:my-1 prose-p:leading-relaxed",
        "prose-ul:my-1 prose-ol:my-1",
        "prose-li:my-0",
        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
        "prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
});
