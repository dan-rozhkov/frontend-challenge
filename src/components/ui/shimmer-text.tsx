import { cn } from "@/lib/utils";
import { useMemo, type ReactNode } from "react";

const SHIMMER_DURATION_MS = 2000;

interface ShimmerTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * Animated "shimmer wave" text — a moving highlight that sweeps across the
 * glyphs. The shared loading affordance for in-flight states (running tool
 * operations, the agent working, a rollback in flight).
 *
 * The wave is phase-synced to the wall clock via a negative `animation-delay`,
 * so every instance shimmers in lockstep regardless of when it mounted.
 */
export function ShimmerText({ children, className }: ShimmerTextProps) {
  const delay = useMemo(() => {
    const phase = performance.now() % SHIMMER_DURATION_MS;
    return `-${phase}ms`;
  }, []);

  return (
    <span
      className={cn("shimmer-text", className)}
      style={{ "--shimmer-delay": delay } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
