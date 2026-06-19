---
name: run-blutils
description: Build, launch, and drive the blutils app — a static prerendered Preact SPA of in-browser developer Tools. Use to run, start, serve, screenshot, or smoke-test blutils, or to confirm a change works in the real running app (not just typecheck). Drives it headless via a dependency-free Chrome DevTools Protocol driver.
---

# Run blutils

blutils is a **static, prerendered Preact SPA** — a catalog of local-only
developer Tools (JSON format, base64, hashing, regex, diff, cron, QR…).
There is no server at runtime; `pnpm build` emits `dist/` and a tiny Node
script serves it. To *see a change work*, you build (or run the dev server),
serve it, and drive it headless with **`.claude/skills/run-blutils/driver.mjs`**
— a zero-dependency CDP harness that launches Brave, navigates, types into the
hydrated UI, reads the DOM, and screenshots.

All paths below are relative to the repo root (`/Users/blut/projects/blutils`).

## Environment quirks (read first — they bite immediately)

This machine's `pnpm` on `PATH` is a corepack shim that tries to **download**
pnpm `10.28.2` (pinned in `package.json#packageManager`) on every invocation
and fails (`EPERM … mkdir … corepack`, or a network block). A real pnpm
`10.31.0` is installed via mise. Every `pnpm` command below is run through this
preamble, which puts the real binary first and disables version self-management:

```sh
export PATH="$(dirname "$(find ~/.local/share/mise/installs/pnpm -maxdepth 2 -name pnpm -type f | head -1)")":$PATH
export PNPM_HOME="$TMPDIR/pnpm-home" XDG_DATA_HOME="$TMPDIR/xdg-data"
export npm_config_manage_package_manager_versions=false
pnpm --version   # → 10.31.0, no corepack download
```

Two more, both handled by the agent (not the app):
- **Binding a port is blocked by the command sandbox** (`listen EPERM`). Run the
  dev/preview server with the sandbox disabled.
- **There is no `chromium-cli`.** The driver speaks CDP to **Brave** directly.
  Override the binary with `BLUTILS_BROWSER=/path/to/chromium` if Brave is absent.

## Prerequisites

- Node 20+ (this session used `node 24.12.0` at
  `~/.local/share/mise/installs/node/24.12.0/bin/node`).
- pnpm 10.x (mise-installed; see the preamble above).
- A Chromium-family browser. This session used **Brave** at
  `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`.

## Setup

```sh
# (run the preamble from "Environment quirks" first)
pnpm install
```

`esbuild`'s build script is ignored by pnpm — that's fine, Vite still works.

## Build

```sh
pnpm run build        # build:client → build:server (SSR) → build:prerender
```

Emits `dist/` with 32 prerendered routes (`prerendered 32 routes …`).
`pnpm run typecheck` (`tsc --noEmit`) is the real correctness gate — it passes
clean. **There is no test suite**: the README mentions `pnpm test` but no
`test` script and no `vitest` exist (see Gotchas).

## Run (agent path) — build, serve, drive

Serve `dist/` (the static preview must run with the **sandbox disabled** so it
can bind the port):

```sh
PORT=4173 node scripts/preview-static.mjs &     # serves dist/ on :4173
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4173/   # → 200
```

Then drive a real user flow with the CDP driver. This navigates to the JSON
Tool, **types fresh JSON into the hydrated textarea**, confirms the output
reformatted, and writes a screenshot:

```sh
node .claude/skills/run-blutils/driver.mjs http://localhost:4173/format/json \
  --type 'textarea={"z":26,"a":1,"nested":{"k":[3,2,1]}}' \
  --eval 'document.querySelector(".output, pre, code")?.textContent?.slice(0,40)' \
  --shot "$TMPDIR/blutils.png"
# → eval: "{\n  \"z\": 26,\n  \"a\": 1,\n  \"nested\": {\n …"
# → shot: /…/blutils.png
```

Seeing the typed input reflected in the output proves hydration is live, not
just the prerendered HTML. **Look at the screenshot** — it should show the
sidebar, INPUT/OUTPUT panels, and the status bar counters (`8 nodes`, `4 keys`).

### Driver reference

```
node .claude/skills/run-blutils/driver.mjs [options] <url>
  --type <sel>=<text>   set an input/textarea value and fire 'input' (hydration)
  --click <sel>         click the first match
  --text <sel>          print textContent of the first match (repeatable)
  --eval <expr>         evaluate JS in the page, print JSON result (repeatable)
  --wait <sel>          block until selector exists (exit 1 if it never appears)
  --shot <path>         PNG screenshot after all actions
  --size <WxH>          viewport (default 1280x800)
  --settle <ms>         pause after load / between actions (default 700)
  --keep                leave the browser running for manual CDP poking
  --brave <path>        browser binary (or set BLUTILS_BROWSER)
```

Actions run in command-line order. Useful routes:
`/format/json`, `/encode/base64`, `/hash/sha256`, `/inspect/regex`,
`/text/diff`, `/time/cron`, `/generate/qr` (full list: `dist/sitemap.xml`).

## Run (faster iteration on source changes) — dev server

For editing `src/`, skip the build and use Vite's dev server (HMR). It also
needs the sandbox disabled to bind its port. Invoke Vite directly (not the
`pnpm dev` shim) to dodge a second corepack hop:

```sh
node node_modules/vite/bin/vite.js --port 5173 --strictPort &
#   VITE v6.4.2  ready … ➜  Local:   http://localhost:5173/
node .claude/skills/run-blutils/driver.mjs http://localhost:5173/format/json \
  --type 'textarea={"dev":true}' \
  --eval 'document.querySelector(".output, pre, code")?.textContent?.includes("dev")'
# → eval: true
```

## Run (human path)

`pnpm dev` opens a dev server at `http://localhost:5173`; `pnpm preview` serves
a prior build at `:4173`. Both expect a human in a browser and are useless
headless — use the driver instead.

## Gotchas

- **`pnpm` self-download fails.** The `package.json` pin (`pnpm@10.28.2`) makes
  the corepack shim try to fetch that exact version → `EPERM mkdir …corepack`
  or a network block. Fix = the preamble (real pnpm first on `PATH` +
  `npm_config_manage_package_manager_versions=false`). Setting that flag via
  `pnpm config set … --location project` instead silently writes a
  `pnpm-workspace.yaml` into the repo — use the **env var**, not config.
- **Nested `pnpm` in scripts.** `build` runs `pnpm build:client && …`; those
  inner calls re-resolve `pnpm` from `PATH`, so the real binary must be first
  or they hit corepack again. (This is why the dev section calls
  `node node_modules/vite/bin/vite.js` directly.)
- **Servers can't bind a port under the command sandbox** (`listen EPERM
  0.0.0.0:4173`). Run `preview-static.mjs` / Vite with the sandbox disabled.
- **No `chromium-cli`, no Playwright browsers.** The driver talks raw CDP over
  Node 24's global `WebSocket` to Brave — no npm install needed. Wrong/missing
  browser → set `BLUTILS_BROWSER`.
- **`pnpm test` does not exist.** The README lists it, but `package.json` has no
  `test` script and `vitest` isn't installed, despite `Tool.test.ts` files in
  `src/tools/*`. The verifiable gate is `pnpm run typecheck` + driving the app.
- **Prerender ≠ hydration.** A screenshot of a freshly-loaded page looks right
  even if JS is broken, because the HTML is prerendered. Always `--type`
  something and assert the output changed to prove the app is actually live.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Error: EPERM … mkdir … corepack` | Run the preamble; ensure real pnpm is first on `PATH`. |
| `pnpm install` → `EPERM … mkdir …Library/pnpm/.tools` | Same — pnpm trying to self-switch versions; set `npm_config_manage_package_manager_versions=false`. |
| `listen EPERM: operation not permitted 0.0.0.0:<port>` | Start the server with the command sandbox disabled. |
| `preview: dist not found. run pnpm build first.` | Run `pnpm run build` before `preview-static.mjs`. |
| `DRIVER ERROR: timed out waiting for http://localhost:9222/json/version` | Browser binary not found/launchable — check Brave path or set `BLUTILS_BROWSER`. |
| Driver `wait failed: selector … never appeared` | The route or selector is wrong; confirm the URL serves 200 and inspect with `--eval 'document.body.innerHTML.length'`. |
