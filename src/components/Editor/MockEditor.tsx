import { useChatStore } from "@/stores/chat-store";
import { File } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

// Rows are a fixed height (leading-5 = 20px, no wrapping) so windowing math is
// exact. OVERSCAN renders a few rows past the viewport on each side so fast
// scrolls don't flash blank.
const ROW_HEIGHT = 20;
const OVERSCAN = 12;

export function MockEditor() {
  const fileContent = useChatStore((s) => s.fileContent);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  // Track the scroll container's height so the window adapts to resizes — the
  // chat panel can grow/shrink and reflow this pane.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Window: only the rows inside the viewport (plus overscan) are mounted, so a
  // large file renders a constant handful of DOM nodes instead of one per line.
  const total = fileContent.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportH / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(total, startIndex + visibleCount);
  const visible = fileContent.slice(startIndex, endIndex);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 h-12 shrink-0 px-4 border-b border-border bg-muted/30">
        <File className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <span className="text-sm text-sidebar-foreground font-medium">
          mock-file.txt
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
      >
        {total === 0 ? (
          <div className="text-muted-foreground italic">
            No file content yet. Agent will modify this file during the
            conversation.
          </div>
        ) : (
          // A spacer of the full content height keeps the scrollbar honest; the
          // mounted window is pushed down by translateY so each row lands at its
          // true position.
          <div style={{ height: total * ROW_HEIGHT }}>
            <div
              style={{ transform: `translateY(${startIndex * ROW_HEIGHT}px)` }}
            >
              {visible.map((line, i) => {
                const index = startIndex + i;
                return (
                  <div key={index} className="flex h-5 leading-5">
                    <span className="select-none text-muted-foreground/50 pr-4 text-right w-8">
                      {index + 1}
                    </span>
                    <span className="text-foreground whitespace-pre">
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
