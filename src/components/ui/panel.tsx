import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Invoked when Escape is pressed anywhere inside the panel. */
  onClose?: () => void;
  /** Play the light entrance animation on mount. Defaults to true. */
  animated?: boolean;
}

/**
 * Inline card shared by the rollback-confirm, message-edit, and feedback-comment
 * blocks. Owns the common chrome (rounded border, muted fill, vertical stack)
 * and Escape-to-close; colors and padding can be overridden via `className`.
 */
const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, onClose, onKeyDown, animated = true, ...props }, ref) => (
    <div
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === "Escape" && onClose) {
          e.preventDefault();
          onClose();
        }
        onKeyDown?.(e);
      }}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2.5",
        animated && "animate-panel-in",
        className,
      )}
      {...props}
    />
  ),
);
Panel.displayName = "Panel";

export { Panel };
