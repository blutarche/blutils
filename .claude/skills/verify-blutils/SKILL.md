---
name: verify-blutils
description: Prove a blutils change works in the real app. Builds the static prerendered Preact SPA of developer Tools, serves it on an isolated port, drives it headless over CDP (tool input/output, command palette, chain mode, sidebar and pins, tweaks/tabs/help), and keeps screenshots plus DOM and storage evidence in .verify/<run-id>/. Use before claiming a blutils UI or Tool change is done, or to smoke-test any feature listed in features/.
---

# Verify blutils

blutils is a catalog of in-browser developer Tools (JSON format, base64, hashing, regex, diff, cron, QR, …). The user-facing surface is a **web UI**: `pnpm build` prerenders one HTML file per route into `dist/`, and the client hydrates it. There is no backend; all state is browser storage.

This skill launches that production build on its own port, drives it with a zero-dependency Chrome DevTools Protocol driver (headless Brave), and keeps the proof. The feature recipes live in [`features/`](features/README.md); read the index before driving anything.

**Sandbox:** every command that starts, checks, drives, or stops an instance must run with the command sandbox disabled (`dangerouslyDisableSandbox: true`). Inside it, binding a port fails with `listen EPERM`, and `ps` and `curl` to localhost are blocked. `pnpm build`, `pnpm test`, and `pnpm typecheck` work sandboxed.

Not covered: the **Tauri desktop app** (`src-tauri/`). On every launch it checks GitHub for an update, installs it, and relaunches with no prompt (`src/app/tauri-bridge.ts:49-54`), and its build skips prerender. Do not launch it to verify; it wraps the same UI this skill drives.

## Launch

From the repo root:

```sh
.claude/skills/verify-blutils/up.sh                  # pnpm build, then serve dist/ on a free port
SKIP_BUILD=1 .claude/skills/verify-blutils/up.sh     # serve the existing dist/ as-is
.claude/skills/verify-blutils/up.sh .verify/my-run   # choose the run dir (default .verify/<timestamp>)
```

Ready when it prints `ready http://127.0.0.1:<port> pid=<pid> run=.verify/<run-id>` and exits 0. Readiness means `/format/json` served its own `<title>JSON Formatter`. A bare HTTP 200 proves nothing, because the preview server answers every unknown path with the home page and status 200.

`up.sh` writes into the run dir:

- `state.env`: `RUN`, `PID`, `PORT`, `URL`, `COMMIT`, `DIRTY` (count of uncommitted source files at launch).
- `build.log` and `server.log`.

Shell state does not survive between Bash calls, so start every later command with `. .verify/<run-id>/state.env`.

The server is `scripts/preview-static.mjs`. It resolves paths the way Cloudflare Pages does in production. Build takes about 3 s.

**Isolation:**

- Each `up.sh` gets its own free port.
- Each driver invocation gets a fresh throwaway browser profile, so localStorage and sessionStorage start empty every time. No reset step is needed between recipes.
- All instances serve the same `dist/`. Rebuilding swaps files under any other running instance; start a second concurrent instance with `SKIP_BUILD=1`.
- Never drive an instance you did not start. The user's own `pnpm dev` runs on :5173 and `pnpm preview` on :4173.

## Doctor

```sh
.claude/skills/verify-blutils/doctor.sh .verify/<run-id>
# OK http://127.0.0.1:53081 pid=9869 commit=4c29d5e dirty_files_at_up=0
```

Read-only; exit 0 means the instance is worth driving. It checks four things:

- The recorded pid is this run's `preview-static.mjs`.
- That pid owns the listening port.
- The route `<title>` marker is served.
- `WARN` lines: HEAD moved since launch, or source files are newer than `dist/`. On a WARN, relaunch without `SKIP_BUILD` before proving anything about current code.

Run doctor first, and again whenever a drive fails strangely.

**In-page liveness:** prerendered HTML looks complete with JavaScript dead. Before asserting anything, wait for the hydration marker `.side-row[aria-roledescription]`. Drag-and-drop adds it to pinned sidebar rows only after hydration: 0 matches in `dist/format/json/index.html`, 5 on the live page.

## Drive

The harness is `.claude/skills/run-blutils/driver.mjs`, shared with the `run-blutils` skill. It launches headless Brave at `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`; override with `BLUTILS_BROWSER=/path/to/chromium`.

```
node .claude/skills/run-blutils/driver.mjs [options] <url>
  --wait <sel>          block until selector exists (5 s; exit 1 if it never appears)
  --type <sel>=<text>   set an input/textarea value via the native setter, fire input+change
  --key <combo>         trusted key event to the focused element: "Meta+k", "Control+k",
                        "/", "?", "g", "2", "Enter", "Escape", "ArrowDown"
  --click <sel>         element.click() on the first match (click only: no mousedown, pointer, or hover)
  --eval <expr>         run JS in the page, print `eval: <JSON>`; a throw exits 1
  --text <sel>          print textContent of the first match
  --shot <path>         PNG screenshot at this point in the sequence (repeatable)
  --size <WxH>          viewport, default 1280x800; keep width >= 761 except for the mobile drawer
  --settle <ms>         pause after load and after each type/click/key (default 700)
```

Actions run in command-line order inside **one browser per invocation**. A flow whose steps depend on each other (open the palette, type, press Enter) must be a single invocation, and the next invocation starts from empty storage.

Standard shape, logging to the run dir with the exit code visible:

```sh
. .verify/<run-id>/state.env
node .claude/skills/run-blutils/driver.mjs "$URL/format/json" \
  --wait '.side-row[aria-roledescription]' \
  --shot "$RUN/format-json-before.png" \
  --type '.two-col .panel:first-child textarea=[3,{"b":2,"a":1}]' \
  --eval '(() => { const o = document.querySelector("pre.hl-block")?.textContent; if (!o?.includes("\"b\": 2")) throw new Error("output not reformatted: " + o); return o })()' \
  --shot "$RUN/format-json-after.png" \
  > "$RUN/format-json.log" 2>&1; echo "exit=$?"; cat "$RUN/format-json.log"
```

**Assert pattern:** wrap a check in an IIFE that throws on failure. The driver then exits 1 with `DRIVER ERROR: Error: <message>` and a stack line, so a broken feature cannot pass as a logged value nobody read.

**Reload inside one invocation**, for persistence proofs:

```
--eval 'setTimeout(() => location.reload(), 0), "reloading"' \
--eval 'new Promise(r => setTimeout(r, 1500))' \
--wait '.side-row[aria-roledescription]' \
--eval 'performance.getEntriesByType("navigation")[0].type'   # must print "reload"
```

Without the nav-type check you may be reading the old document.

**Selectors and keys:**

- The app has **no `data-*` or test ids**. Use `aria-label`s and roles first, then the classes the feature files name; every one was checked against a live page.
- `--type` selectors may contain `[attr="x"]`, and the text may contain `=`.
- Global shortcuts (`/`, `?`, `g N`) are ignored while focus is in a text field.
- Status-bar segments are `span[role=button]` with no key handler, so `--click` them.

**Routes:**

- `/` is home, `/chain` is Chain mode, and Tools live at `/<category>/<slug>`.
- Aliases preselect state; for example, `/format/json-minify` opens with minify on.
- Canonical list: `dist/sitemap.xml` (43). All 82 routes, aliases included, are in `build.log`.
- Unknown paths render `h1.route-heading` "not found" with status 200.

## Evidence

All proof goes to `.verify/<run-id>/`. The directory is repo-local and gitignored, so it is reachable with or without the sandbox (`$TMPDIR` differs between the two) and survives `down.sh`. Per feature, keep:

- `<feature>.log`: driver stdout, with every `eval:` value, `shot:` path and `DRIVER ERROR`, plus the `exit=` line.
- Screenshots before and after the action (`<feature>-before.png`, `<feature>-after.png`). Open them with Read and look: sidebar, Tool heading, both panels, status bar.
- `state.env`: the commit and dirty count that the proof applies to.

Proof standards:

- **Real user path.** Type, click, and press keys in the UI. Do not prove a Tool by writing `sessionStorage` and reloading, or by calling `engine.ts`. Seeding storage is allowed only as a stated precondition, never as the step under test.
- **Prerender is not hydration.** A just-loaded page proves nothing. The proof is input changing output within the same invocation.
- **Action and result.** Capture the state before and after, and log the eval values that show the transition.
- **Side effects.** Check storage, URL, and title alongside what is visible. Storage keys, all prefixed `blutils:`:
  - sessionStorage `input:<toolId>`: Tool input, written on every change.
  - sessionStorage `chain.input`: the chain's input text.
  - localStorage `recent:v1`, `pinned:v1`, `tabs:v1`, `tweaks:v1`, `chain:v1`.
  - localStorage `inputs:v1`: only when the "remember inputs" tweak is on, written 500 ms after typing stops.
- **Clipboard contents are not provable headless.** What a copy put on the clipboard, the Tool "copied · N B" status flash, and palette clipboard detection need clipboard permission, which `driver.mjs` does not grant. Report them as skipped with that reason; do not substitute another path. Chain mode's `copied!` button labels do flip headless, and prove only the button feedback.
- **Report**, per feature file: each sub-feature ID verified, the entry point used, and the run dir. List skipped IDs with the reason.

`pnpm test` (vitest, 467 algorithm-only tests, no DOM) and `pnpm typecheck` back up a UI proof but never replace it.

## Cleanup

```sh
.claude/skills/verify-blutils/down.sh .verify/<run-id>
# down: port 53081 free; evidence kept in .verify/<run-id>: …
```

`down.sh` kills only the recorded pid, and only after confirming it is `preview-static.mjs`. It then confirms the port is free and lists the evidence it kept.

Each driver invocation closes its own browser and deletes its profile, so there is nothing else to stop. If a driver was interrupted, `pgrep -fl blutils-brave-` lists orphans. Kill only pids whose `--user-data-dir` you saw in that run. Never `pkill` node or Brave by name: the user's own Brave and dev servers share those names.

Leave `.verify/<run-id>/` in place; delete it only when the user no longer needs the proof. Run `down.sh` after every failed attempt too, so broken attempts don't strand servers.

## Helpers

All of these are executable and run from the repo root with the sandbox off:

- `.claude/skills/verify-blutils/up.sh [run-dir]`: build (unless `SKIP_BUILD=1`), serve on a free port, write `state.env`, and wait for readiness.
- `.claude/skills/verify-blutils/doctor.sh <run-dir>`: read-only health check; exit 0 means OK.
- `.claude/skills/verify-blutils/down.sh <run-dir>`: stop this run's server and keep the evidence.
- `node .claude/skills/run-blutils/driver.mjs …`: the CDP driver; options are under Drive.

For hot-reload iteration on `src/`, the `run-blutils` skill covers the Vite dev server. The final proof always runs on an `up.sh` build, because only that exercises prerender and hydration.

## Environment notes (checked 2026-10-06)

- `pnpm` 10.28.2 from the mise shim works directly. The corepack preamble in `run-blutils` was not needed; use it only if `pnpm` fails with `EPERM … corepack`.
- Node 24 (its global `WebSocket` is what lets the driver run with no dependencies).
- `lsof`, `ps`, and `curl` are used by the helpers and need the sandbox off.
