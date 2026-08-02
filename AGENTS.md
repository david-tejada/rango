# AGENTS.md

Guidance for coding agents working in this repository.

## CLI transport (daemon / cli / shared)

This repo ships a second, independent codepath alongside the browser
extension: a CLI transport that drives Rango's hint navigation from the
command line. It lives in three top-level directories that are **not**
part of the Parcel-bundled extension build:

- `shared/` — wire protocol (`protocol.ts`), frame codec (`frame.ts`), and
  shared filesystem paths (`platform.ts`), used by both `daemon/` and
  `cli/`.
- `daemon/` — a Bun-based host companion daemon. It exposes an HTTP API
  (`GET /health`, `POST /command`) for the CLI leg, and bridges to the
  extension over Chrome/Firefox's native-messaging stdio protocol (4-byte
  little-endian length-prefixed JSON frames) for the extension leg.
- `cli/` — the `rango-cli` binary. Auto-spawns the daemon if one isn't
  already running, then POSTs commands to it over HTTP.

Run with Bun, not Node: `npm run daemon`, `npm run cli`, `npm run
test:daemon`. Typecheck this code with `npm run check-types:daemon` (a
separate `tsconfig.bun.json`, not the root `tsconfig.json` — the root
config is scoped to the browser-extension code and excludes these three
directories, since they need Bun's globals/types and top-level `await`
rather than the extension's DOM-flavored config).

### Why a daemon instead of the extension serving HTTP directly

MV3 service workers cannot serve HTTP. The daemon is a separate host
process (installed as a native-messaging host) that bridges the CLI's
HTTP requests to the extension's native-messaging port. This mirrors the
architecture of the sibling `Interceptor` project.

### Singleton / relay pattern

Chrome/Firefox spawn a fresh native-messaging host process every time the
extension calls `connectNative()` — e.g. once per browser window/profile
that has Rango open. Only one process may own the CLI-facing HTTP port
and PID/port files at a time. `daemon/lifecycle.ts` and `daemon/index.ts`
implement a two-layer election, mirroring Interceptor:

1. **Advisory**: a PID file records the presumed singleton. A stale PID
   file (dead process) doesn't block a new singleton from taking over.
2. **Authoritative**: real exclusivity comes from binding the control
   socket (`Bun.listen({unix: ...})`). Whichever process wins that bind
   is the singleton.

A process that loses the election does not exit or duplicate state —
it becomes a **transparent byte relay** (`daemon/relay.ts`): it pipes raw
framed bytes between its own stdio (the browser's native-messaging pipe
for that window) and the singleton's control socket. The singleton's
`ExtensionBridge` (`daemon/extensionBridge.ts`) is agnostic to whether its
writer is its own stdio or a relayed control-socket connection — both
speak the same frame format, so multiple browser windows can each hold a
native-messaging connection while only one process does protocol work.

### Command reuse, not new commands

`cli/commands.ts` maps CLI verbs onto Rango's **existing** `ActionMap`
entries (`enableHints`, `refreshHints`, `disableHints`, `clickElement`)
dispatched through the existing `handleCommand()` in
`src/background/commands/commandHandler.ts` — the same dispatcher the
clipboard/Talon transport already uses. No new Action types were added.
Hint visibility uses `enableHints({level: "now"})`, the existing
rendering-coupled overlay (`Hint.ts`) at Rango's ephemeral toggle level —
this is intentionally the temporary-overlay MVP path, not a headless
hint-computation path (that would be a separate follow-up).

### Testing without a live browser

`daemon/*.test.ts` and `cli/*.integration.test.ts` mock the extension leg
by connecting directly to the daemon's control socket (the same
Unix-socket API a relayed browser process would use) and speaking the
same frame protocol by hand. The integration tests spawn the *real*
`daemon/index.ts --standalone` and `cli/index.ts` binaries as
subprocesses (via `Bun.spawn`) rather than importing their internals, so
they exercise the actual CLI-to-daemon-to-extension round trip end to
end. Run with `bun test daemon cli shared` (or `npm run test:daemon`).

Each test file that touches `shared/platform.ts` (which reads
`RANGO_HOME` at import time) isolates itself with its own temp directory.
Only one test file may import `shared/platform`/`daemon/lifecycle`
directly per `bun test` process, since Bun's module cache means a second
file importing it would see the first file's `RANGO_HOME`, not its own —
other test files that need an isolated daemon instance compute the
expected paths manually (`path.join(tempHome, "daemon.port")`, etc.)
instead of importing `shared/platform`.

### Browser scope

Chrome and Firefox only. Safari uses a fundamentally different
native-messaging API (`NSExtensionRequest`, not a stdio host process)
and is out of scope for this transport — `isSafari()` gates
`connectNativeHost()` in `src/background/background.ts` so the native
messaging connection is never attempted there.

## Maintaining this file

Keep this file scoped to knowledge that isn't obvious from reading the
code itself: cross-cutting architectural decisions, non-obvious
constraints, and *why* something is structured the way it is. Update it
when you make a decision future agents would otherwise have to
rediscover by reading a stack trace or a PR discussion. Don't restate
what a docstring or file layout already makes clear.
