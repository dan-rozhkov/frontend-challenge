# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc -b (type-check) then vite build → dist/
npm run lint     # ESLint over the repo
npm run preview  # Serve the production build locally
```

There is no test runner configured; "tests" in the app are mocked (see below). Type-checking happens via `tsc -b` as part of `build`.

## What this is

A **mocked AI coding agent sandbox** — a frontend-only app: a chat panel (left) and a mock code editor (right), with no real backend. The agent's responses are a hardcoded script; the focus of this repo is the **message-edit + file-rollback flow** (see `useChatActions` / `UserMessage` below). `docs/DEVELOPMENT.md` has the dev-facing notes on the mock backend and components.

**Some pre-existing rough edges are left in on purpose**, outside the edit/rollback feature. Comments marked `INTENTIONAL BUG` flag them (e.g. no immediate loading indicator after send, in `src/hooks/useChatActions.ts`; layout `min-w` issues in `src/App.tsx` that let the chat panel collapse). They sit outside the feature scope — leave them unless explicitly asked.

## Architecture

The data flow is: **`useChatActions` orchestrates** (the hook owns the send/rollback logic; `App.tsx` is a thin shell) → calls the **mock backend** (an async generator) → writes results into the **Zustand store** → components subscribe via selectors.

- **`src/services/mock-backend.ts`** — The simulated agent. `sendMessage()` is an `async generator` that yields a fixed script of responses from `HARDCODED_RESPONSES` (text messages + tool calls: `list_dir`, `read_file`, `edit_file`, `run_test`). It injects artificial delays, a random `ERROR_RATE` (5%) that throws mid-stream, and supports cancellation via an `AbortSignal`. `responseIndex` is threaded through so a new `sendMessage` call resumes the script where the last one stopped (modulo the array length). `rollbackToMessage()` and `stopAgent()` are also async-with-delay-and-random-error mocks. `rollbackToMessage()` is the source of truth for the file content after a rollback (it scans back to the last completed `edit_file`). There is no network.

- **`src/stores/chat-store.ts`** — Single Zustand store. Holds `messages`, `fileContent` (the mock file as a `string[]`), `isAgentWorking`, `responseIndex`, the live `abortController`, and the rollback flags `isRollingBack` / `rollbackTargetId`. `applyRollback(id, fileContent)` is a pure transaction: it truncates the history **inclusively** (slice to `index + 1`), sets the file content **supplied by the mock backend** (not reconstructed here), and recomputes `responseIndex` from the remaining slice so a later resend continues from the right point.

- **`src/App.tsx`** — Thin shell: renders the chat panel (header, message list, composer) and the editor, wires `useChatActions`, and disables the composer while a rollback is in flight.

- **`src/hooks/useChatActions.ts`** — Owns the orchestration. `runAgent` is the agent-playback loop (consumes the generator, converts each yielded response into a typed `ChatMessage`, drives store updates; reads `responseIndex`/`fileContent` from the store at call time so it can be reused after a rollback). `handleSubmit` / `handleInterrupt` wrap it. `runRollback` is the **single async path behind both Edit and Restore**: it calls the mock `rollbackToMessage`, applies the result via `applyRollback`, and on Edit replaces the message text and resends. `cancelRollback` aborts the in-flight (~5s) rollback. Cancellation distinguishes `AbortError` (→ "Agent stopped") from real errors.

- **`src/types/chat.ts`** — The `ChatMessage` discriminated union (`user | agent_message | tool_operation | error`) keyed on `type`. This is the contract between backend, store, and components — extend it here when adding message kinds.

- **`src/components/Chat/`** — Presentational components keyed off message type (`MessageList` groups consecutive tool operations; `ToolOperationMessage` is collapsible with a shimmer for `running`; `FeedbackForm`, `AgentMessage`, `Markdown`, etc.). `UserMessage` doubles as a rollback checkpoint — hover/focus reveals Edit and "Restore to here", backed by the inline `MessageEditor`, the destructive `RollbackConfirm`, and a "Reverting…" loader with Cancel. `src/components/Editor/MockEditor.tsx` renders `fileContent`.

## Conventions

- **Path alias**: import from `@/...` (maps to `src/`), configured in both `vite.config.ts` and `tsconfig.json`.
- **Styling**: Tailwind with a dark-by-default CSS-variable palette (`tailwind.config.js` maps tokens like `sidebar`, `background`, `muted`, `primary`, plus semantic status tokens `brand` / `success` / `warning` / `info` and `*-hover` variants, to `hsl(var(--...))` defined in `src/styles/index.css`). Prefer the semantic tokens over hardcoded Tailwind colors. Use the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge) for conditional classes. Avoid inline styles.
- **TypeScript** is `strict` with `noUnusedLocals`/`noUnusedParameters` — unused symbols fail the build.
- New message types must be added to the `ChatMessage` union and handled in the rendering switch.

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on push to `main`. The Vite `base` is `/frontend-challenge/` (must match the repo name) — keep that in mind for any absolute asset paths.
