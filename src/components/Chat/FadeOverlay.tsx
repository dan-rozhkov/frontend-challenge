import { cn } from "@/lib/utils";

/**
 * A short gradient that dissolves adjacent content into the sidebar background
 * instead of meeting a hard edge. Used around the rollback popover (UserMessage).
 * `direction="down"` (default) fades content sitting *below* the overlay;
 * `direction="up"` fades content *above* it. Purely decorative, so it ignores
 * pointer events.
 */
export function FadeOverlay({
  direction = "down",
}: {
  direction?: "up" | "down";
}) {
  return (
    <div
      className={cn(
        "pointer-events-none h-6",
        direction === "down"
          ? "bg-gradient-to-b from-sidebar to-transparent"
          : "bg-gradient-to-t from-sidebar to-transparent",
      )}
    />
  );
}
