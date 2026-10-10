# Command palette

The command palette is a modal search over every Tool plus a handful of app commands (go home, toggle theme or density, open chain, copy permalink, clear all data, pin/unpin the current Tool). The user types a fuzzy query, moves with the arrow keys, and opens the result with Enter.

## Sub-features

- `palette-open`: the palette opens from every entry point with focus in its input.
- `palette-search`: a fuzzy query narrows the list to matching Tools and commands, with the matched letters marked, and the footer `.palette-foot` counts the results.
- `palette-recent`: with an empty query, recently visited Tools appear under a `Recent` section above `Tools` and `Commands`.
- `palette-open-result`: Enter (or a click) on a Tool result navigates to its canonical URL and closes the palette.
- `palette-navigate`: ArrowDown and ArrowUp move the `.on` highlight. Hovering a row moves it too, but the driver has no hover.
- `palette-close`: Esc, ⌘K again, or a mouse press on the backdrop closes it. The backdrop listens for `mousedown`, which `--click` does not send, so only Esc and ⌘K are drivable.
- `palette-command`: running a command (e.g. `Toggle theme`) applies it.
- `palette-empty`: a query with no matches shows `no matches`.
- `palette-detect`: with "smart hints" on, opening the palette reads the clipboard and offers `open in <tool>`. This needs clipboard permission, so it is not drivable headless.

## How to get to it (user POV)

- Press ⌘K or Ctrl+K anywhere. It is a toggle.
- Press `/` while focus is outside a text field.
- Click `commands ⌘K` in the header: `.h-btn[aria-label="Open command palette"]`.
- Click `palette` in the status bar: `footer.status [aria-label="Open command palette"]`.
- Click the call-to-action on the home page: `.home-cta`.
- Desktop app only: the native menu's palette item, ⌘K. Not driven; see `SKILL.md`.

## Driving it with driver.mjs

Preconditions:

- `doctor.sh` prints `OK` for this run, and `state.env` is loaded.
- `D=.claude/skills/run-blutils/driver.mjs`.

Steps:

- **Open, search, open result (keyboard).** Press ⌘K, type `base64`, and press Enter. The palette shows the Tool, then the page navigates to it and the palette is gone.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' --key 'Meta+k' \
    --eval '[!!document.querySelector(".palette[role=dialog][aria-label=\"Command palette\"]"), document.activeElement?.matches(".palette-input-row input")]' \
    --type '.palette-input-row input=base64' \
    --eval '[...document.querySelectorAll(".pal-item")].map(e => [e.classList.contains("on"), e.querySelector(".name")?.textContent])' \
    --shot "$RUN/palette-search.png" --key 'Enter' \
    --eval '[location.pathname, !!document.querySelector(".palette")]' --shot "$RUN/palette-opened.png"
  ```
  Expect `[true,true]`, then a highlighted row `[true,"Base64"]` first, then `["/encode/base64",false]`.
- **Other entry points.** Press `/`, Esc, Ctrl+K twice, then click the header button and the status bar segment.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --key '/' --eval '!!document.querySelector(".palette")' --key 'Escape' --eval '!!document.querySelector(".palette")' \
    --key 'Control+k' --eval '!!document.querySelector(".palette")' --key 'Control+k' --eval '!!document.querySelector(".palette")' \
    --click '.h-btn[aria-label="Open command palette"]' --eval '!!document.querySelector(".palette")' --key 'Escape' \
    --click 'footer.status [aria-label="Open command palette"]' --eval '!!document.querySelector(".palette")'
  ```
  Expect `true, false, true, false, true, true`.
- **Arrow navigation.** Query `json`, then press ArrowDown and ArrowUp. The `.on` highlight moves to index 1 and back to 0.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' --key 'Meta+k' --type '.palette-input-row input=json' \
    --eval '[...document.querySelectorAll(".pal-item")].map(e => (e.classList.contains("on") ? "*" : "") + e.querySelector(".name")?.textContent)' \
    --key 'ArrowDown' --eval '[...document.querySelectorAll(".pal-item")].findIndex(e => e.classList.contains("on"))' \
    --key 'ArrowUp' --eval '[...document.querySelectorAll(".pal-item")].findIndex(e => e.classList.contains("on"))'
  ```
  Expect the first row starred (currently `*Format Converter`), then `1`, then `0`.
- **Navigate and run a command.** Query `theme`, check the highlight, and press Enter on `Toggle theme`. The `<html data-theme>` flips and is saved.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' \
    --eval 'document.documentElement.dataset.theme' --key 'Meta+k' --type '.palette-input-row input=toggle theme' \
    --eval '[...document.querySelectorAll(".pal-item")].map(e => [e.classList.contains("on"), e.querySelector(".name")?.textContent])' \
    --key 'Enter' --eval '[document.documentElement.dataset.theme, JSON.parse(localStorage.getItem("blutils:tweaks:v1")).theme]'
  ```
  Expect `"dark"` first, then `Toggle theme` highlighted, then `["light","light"]`.
- **Empty state.** Query something absent.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' --key 'Meta+k' --type '.palette-input-row input=zzqqxx' \
    --eval '[document.querySelector(".palette-empty")?.textContent, document.querySelectorAll(".pal-item").length]'
  ```
  Expect `["no matches",0]`.
- **Recent.** Open base64 through the palette, then reopen it with an empty query.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' --key 'Meta+k' --type '.palette-input-row input=base64' --key 'Enter' \
    --key 'Control+k' --eval '[...document.querySelectorAll(".pal-section")].map(s => s.textContent.trim().slice(0, 20))' \
    --eval 'document.querySelector(".pal-item .name")?.textContent' --key 'Escape' --eval '!!document.querySelector(".palette")'
  ```
  Expect `["Recent","Tools","Commands"]`, then `"Base64"`, then `false`.

## Gotchas

- `/` opens the palette, not the sidebar filter, even though the help sheet and the sidebar hint (`/`) suggest it filters the catalog. The code is authoritative (`src/palette/palette-context.tsx:46-64`).
- `/` is ignored while a textarea or input has focus. Press it on a freshly loaded page or after Escape.
- Esc is handled on the palette input. If focus leaves the input, Esc does nothing.
- Recent rows are `.pal-item`s too, shown only for an empty query. They never get `.on`, the arrow keys cannot reach them, and they are not counted. Type a query before indexing `.pal-item`. A fresh driver profile has no recents anyway.
- While a clipboard detection is armed (no row highlighted yet, before any typing, arrow key or hover), Enter opens the detected Tool instead of a result. Once a row is highlighted, the strip gets `.is-demoted` and Enter opens that row. Headless runs have no clipboard access, so detection never triggers in `driver.mjs`. Do not report `palette-detect` as verified.
- Marks are drawn on the row name even when the hit came from the title, id or a tag. For example, `json` matches Format Converter through a tag and marks `Form`. Assert on row names, not `mark` text.
- `--click '.palette-backdrop'` leaves the palette open (checked live). That is the driver lacking `mousedown`, not a product bug.
- `Clear all data` blocks on `window.confirm`, which hangs a headless page. Don't run it through the driver.
- The palette element exists only while open; `!!document.querySelector(".palette")` is the open/closed check.
