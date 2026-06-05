/**
 * Human-readable error copy.
 *
 * The mock backend throws raw `CODE: technical detail` strings (e.g.
 * `NETWORK_TIMEOUT: Connection to agent server lost`). Those are fine for logs
 * but must never reach the UI — we translate the leading code into friendly
 * copy here. Unknown codes fall back to a generic message so a system string
 * can never leak into the chat.
 */

export interface ErrorCopy {
  /** Short, human title shown as the card heading. */
  title: string;
  /** One-line explanation with a hint at what to do next. */
  description: string;
}

const ERROR_COPY: Record<string, ErrorCopy> = {
  NETWORK_TIMEOUT: {
    title: "Couldn’t reach the agent",
    description: "The connection timed out. Check your network and try again.",
  },
  ROLLBACK_FAILED: {
    title: "Couldn’t roll back",
    description: "We couldn’t restore that checkpoint. Try again in a moment.",
  },
};

const FALLBACK: ErrorCopy = {
  title: "Something went wrong",
  description: "The agent hit an unexpected error. Please try again.",
};

/** Extract the leading `CODE:` token from a raw backend error string. */
export function errorCodeOf(raw: string): string | undefined {
  const match = /^([A-Z][A-Z0-9_]+):/.exec(raw.trim());
  return match?.[1];
}

/** Map a raw backend error (or a bare code) to user-facing copy. */
export function describeError(raw: string): ErrorCopy {
  const code = errorCodeOf(raw);
  return (code && ERROR_COPY[code]) || FALLBACK;
}
