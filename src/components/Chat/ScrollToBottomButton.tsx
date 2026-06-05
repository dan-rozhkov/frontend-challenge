import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { ArrowDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottomButton({
  visible,
  onClick,
}: ScrollToBottomButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border",
        "bg-sidebar-accent px-3 py-1.5 text-xs text-sidebar-foreground shadow-lg",
        "transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none",
      )}
    >
      <ArrowDown className="h-3 w-3" />
      <span>New messages</span>
    </Button>
  );
}
