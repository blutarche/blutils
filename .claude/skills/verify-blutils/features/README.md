# blutils verification map

This directory is the maintained source for verifying blutils' user-facing behavior. Read this index, then use the matching feature file as the recipe. Launch, doctor, evidence rules, and cleanup are in [`../SKILL.md`](../SKILL.md).

## Baseline preconditions

- Launch a run with `.claude/skills/verify-blutils/up.sh` (sandbox off). It must print `ready http://127.0.0.1:<port> …`.
- `.claude/skills/verify-blutils/doctor.sh .verify/<run-id>` prints `OK` with no `WARN` about stale source.
- Every recipe command assumes this has run in the same Bash call:
  ```sh
  . .verify/<run-id>/state.env; D=.claude/skills/run-blutils/driver.mjs
  ```
- Each driver invocation starts with a fresh browser profile and empty storage. That gives default pins, the default chain, default tweaks, and single-tab mode. No reset step is needed.
- Never drive an instance this run did not start.

## Driving conventions

- Run each recipe command as written, appending `> "$RUN/<sub-feature-id>.log" 2>&1; echo "exit=$?"`, then read the log.
- Start every Tool-page recipe with `--wait '.side-row[aria-roledescription]'` (the hydration marker); on `/chain`, wait on `.chain-drag-handle`.
- Prefer `aria-label`s and roles. The app has no `data-*` or test ids, so the classes named in each file are the stable handles; each was checked on a live page on 2026-10-06.
- Steps that depend on each other go in one driver invocation, because state does not carry across invocations.
- Keyboard entry points use `--key`; status-bar segments must be `--click`ed.
- Use the throwing-IIFE assert pattern from `SKILL.md` when a wrong value must fail the run.

## Proof and skip reporting

- Capture before and after screenshots for the step under test, plus the logged `eval:` values that show the transition.
- Check side effects (sessionStorage and localStorage `blutils:*` keys, `location.pathname`, `document.title`) alongside what is visible.
- Record the sub-feature ID, the entry point used, and the run dir for every proof.
- Not drivable with `driver.mjs`; report as skipped with the reason: clipboard contents (`tool-copy`, `palette-detect`, and the clipboard half of `chain-copy`/`chain-copy-step`), drag (`chain-reorder`, `nav-pin-reorder`), hover, and the palette backdrop (it closes on `mousedown`; `--click` sends only `click`).
- Known-defect steps record the correct result and the output observed on a dated commit. A match with the observed output is that product defect, reported as such, never a pass.
- Never report an entry point as verified through a different one. For example, a palette opened by clicking the header does not verify ⌘K.

## Feature entry contract

Each feature file starts with an H1 and one paragraph of user-visible behavior, then exactly four H2 sections in this order:

1. `Sub-features`: short IDs, one line each.
2. `How to get to it (user POV)`: every user entry point.
3. `Driving it with driver.mjs`: `Preconditions:`, then labeled bullets that pair a user action with an exact command and the expected output.
4. `Gotchas`: traps that waste or invalidate a run.

## Features

- [Tool workspace](./tool-workspace.md): live input → output, validity, options, stats, sample and clear, persistence across reload, alias routes, base64 and url-safe, and recents.
- [Command palette](./command-palette.md): ⌘K, Ctrl+K, `/`, and click entry; fuzzy search; arrow navigation; open a result; run a command; recents; empty state.
- [Chain mode](./chain-mode.md): run, add, and remove steps; picker empty and close; errors and recovery; copy labels; persistence; status-bar entry.
- [Navigation](./navigation.md): sidebar filter and links, home cards, history, breadcrumb home, mobile drawer, `g N` pin shortcuts, pin toggle, category collapse, not-found; known defect in pin chips while filtering.
- [Tweaks, tabs, and help](./tweaks-tabs-help.md): theme, density, toggles, remember-inputs mirroring, multi-tab mode (new, switch, close, disable), the `?` help dialog, close routes; known defects after reload.

Not mapped yet: the individual Tools beyond `format.json` and `encode.base64` (41 Tools in total; see `dist/sitemap.xml`), and the Tauri desktop app (deliberately not driven; see `SKILL.md`).
