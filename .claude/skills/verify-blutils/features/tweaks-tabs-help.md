# Tweaks, multi-tab mode, and shortcut help

Three surfaces in the app shell:

- **Tweaks** sets theme, density, and three toggles (show advanced, smart hints, remember inputs). All are saved locally.
- **Multi-tab mode** adds a tab strip so several Tools stay open at once.
- **Shortcut help** is a modal listing the keyboard shortcuts.

## Sub-features

- `tweaks-open`: the Tweaks dialog opens from the status bar and closes with Esc, the close button, or the backdrop.
- `tweaks-theme`: choosing a theme radio sets `<html data-theme>` and saves it.
- `tweaks-density`: choosing a density radio sets `<html data-density>` and saves it.
- `tweaks-toggles`: the `show advanced`, `smart hints`, and `remember inputs` checkboxes save their state. Remember inputs also mirrors Tool input to localStorage.
- `tabs-enable`: the status-bar toggle turns on the tab strip with the current page as the first tab (on a fresh profile; otherwise saved tabs return).
- `tabs-reload`: tabs mode, the tab strip, and the open tabs survive a reload.
- `tabs-new-close`: `New tab` opens home in a new tab; `Close tab` removes one, and closing the last tab opens a fresh home tab.
- `tabs-switch`: clicking an inactive tab navigates to its page and marks it `aria-selected`.
- `tabs-disable`: the toggle turns tabs mode off and removes the strip; the current page stays.
- `help-open`: `?` opens the Keyboard shortcuts dialog; `?` again, Esc, the close button, or the backdrop dismisses it.

## How to get to it (user POV)

- Tweaks: click `tweaks` in the status bar (`footer.status [aria-label="Open tweaks"]`). ⌘, works only in the desktop app.
- Tabs: click `single` in the status bar (`footer.status [aria-label="Enable Multi-Tab Mode"]`). Once on, it reads `tabs` and its label becomes `Disable Multi-Tab Mode`.
- Help: press `?` while focus is outside a text field.

## Driving it with driver.mjs

Preconditions:

- `doctor.sh` prints `OK` for this run, and `state.env` is loaded.
- `D=.claude/skills/run-blutils/driver.mjs`.
- Tweaks are at defaults: dark theme, regular density, smart hints on, the others off. A fresh driver profile guarantees this.

Steps:

- **Theme.** Open Tweaks, pick the unchecked theme, then close with Esc.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Open tweaks"]' \
    --eval '[...document.querySelectorAll("[role=radiogroup][aria-label=\"Theme\"] button[role=radio]")].map(b => b.textContent.trim() + ":" + b.getAttribute("aria-checked"))' \
    --click '[role=radiogroup][aria-label="Theme"] button[role=radio][aria-checked="false"]' \
    --eval '[document.documentElement.dataset.theme, JSON.parse(localStorage.getItem("blutils:tweaks:v1")).theme]' \
    --shot "$RUN/tweaks-theme.png" --key 'Escape' --eval '!!document.querySelector(".tweaks-panel")'
  ```
  Expect `["dark:true","light:false"]`, then `["light","light"]`, then `false`.
- **Remember inputs.** Turn on the toggle, type into a Tool, and wait past the 500 ms debounce.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Open tweaks"]' \
    --eval '(() => { const l = [...document.querySelectorAll("label.tweaks-toggle")].find(l => l.textContent.includes("remember inputs")); l.querySelector("input").click(); return l.querySelector("input").checked })()' \
    --key 'Escape' --type '.two-col .panel:first-child textarea={"m":1}' \
    --eval 'new Promise(r => setTimeout(r, 800))' \
    --eval '[JSON.parse(localStorage.getItem("blutils:tweaks:v1")).rememberInputs, localStorage.getItem("blutils:inputs:v1")]'
  ```
  Expect `true`, then `[true, <JSON containing "format.json" and {\"m\":1}>]`.
- **Tabs.** Enable tabs, then open a new tab.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Enable Multi-Tab Mode"]' \
    --eval '[!!document.querySelector(".tabs-bar[role=tablist][aria-label=\"Open tabs\"]"), !!document.querySelector(".app.with-tabs"), !!document.querySelector("[aria-label=\"Disable Multi-Tab Mode\"]")]' \
    --click 'button.tab-new[aria-label="New tab"]' \
    --eval '[location.pathname, [...document.querySelectorAll(".tab .tab-label")].map(t => t.textContent), JSON.parse(localStorage.getItem("blutils:tabs:v1")).tabs.map(t => t.path)]' \
    --shot "$RUN/tabs.png"
  ```
  Expect `[true,true,true]`, then `["/",["json.format","home"],["/format/json","/"]]`.
- **Tabs switch, close, disable.** Open a second tab, switch back, close the other tab, close the last one, then turn tabs off.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Enable Multi-Tab Mode"]' --click 'button.tab-new[aria-label="New tab"]' \
    --click '.tab[role=tab][aria-selected="false"]' \
    --eval '[location.pathname, [...document.querySelectorAll(".tab[role=tab]")].map(t => t.getAttribute("aria-selected"))]' \
    --click '.tab[aria-selected="false"] button.tab-close' --eval '[location.pathname, document.querySelectorAll(".tab[role=tab]").length]' \
    --click '.tab button.tab-close' --eval '[location.pathname, [...document.querySelectorAll(".tab .tab-label")].map(t => t.textContent)]' \
    --click 'footer.status [aria-label="Disable Multi-Tab Mode"]' --eval '[location.pathname, !!document.querySelector(".tabs-bar"), !!document.querySelector(".app.with-tabs")]'
  ```
  Expect `["/format/json",["true","false"]]`, then `["/format/json",1]`, then `["/",["home"]]`, then `["/",false,false]`.
- **Tabs after reload (known defect).** Enable tabs, then reload.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Enable Multi-Tab Mode"]' \
    --eval 'setTimeout(() => location.reload(), 0), "reloading"' --eval 'new Promise(r => setTimeout(r, 1500))' --wait '.side-row[aria-roledescription]' \
    --eval '[performance.getEntriesByType("navigation")[0].type, !!document.querySelector(".app.with-tabs"), JSON.parse(localStorage.getItem("blutils:tabs:v1")).enabled, !!document.querySelector(".tabs-bar"), document.querySelectorAll(".tab[role=tab]").length, document.querySelector(".tab")?.parentElement?.className, document.querySelector(".tab")?.parentElement?.getAttribute("role")]' \
    --eval '[document.querySelector("footer.status [aria-pressed]")?.getAttribute("aria-label"), document.querySelector("footer.status [aria-pressed]")?.textContent.trim()]'
  ```
  The correct result is `["reload",true,true,true,1,"tabs-bar","tablist"]`, then `["Disable Multi-Tab Mode","tabs"]`. Hydration of the prerendered no-tabs markup leaves stale attributes: `.app` lacks `with-tabs`, the tab strip hydrates onto CopyAnnouncer's hidden `div.sr-only[role=status]` (so no element has the `tabs-bar` class), and the toggle keeps its old label while its text says `tabs`. On 2026-10-06 (commit 4c29d5e) it printed `["reload",false,true,false,1,"sr-only","status"]`, then `["Enable Multi-Tab Mode","tabs"]`. Report a match with the observed output as this known defect, not as a pass.
- **Show advanced after reload (known defect).** Turn on show advanced, then reload and read the header buttons.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Open tweaks"]' \
    --eval '(() => { const l = [...document.querySelectorAll("label.tweaks-toggle")].find(l => l.textContent.includes("show advanced")); l.querySelector("input").click(); return l.querySelector("input").checked })()' \
    --key 'Escape' --eval '[...document.querySelectorAll("header button")].map(b => b.className + "|" + (b.getAttribute("aria-label") ?? "") + "|" + b.textContent.trim())' \
    --eval 'setTimeout(() => location.reload(), 0), "reloading"' --eval 'new Promise(r => setTimeout(r, 1500))' --wait '.side-row[aria-roledescription]' \
    --eval '[performance.getEntriesByType("navigation")[0].type, ...[...document.querySelectorAll("header button")].map(b => b.className + "|" + (b.getAttribute("aria-label") ?? "") + "|" + b.textContent.trim())]'
  ```
  Expect `true`, then `["h-menu|Open menu|","h-btn||tabs","h-btn||chain","h-btn|Open command palette|commands⌘K"]`. The correct post-reload list is `"reload"` followed by those same four. On 2026-10-06 (commit 4c29d5e) the `tabs` button came back as `"h-btn|Open command palette|tabs"`: it inherits the palette button's prerendered label. Report a match as this known defect, not as a pass.
- **Help.** Press `?` and then Esc.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' --key '?' \
    --eval '!!document.querySelector(".help[role=dialog][aria-label=\"Keyboard shortcuts\"]")' --shot "$RUN/help.png" \
    --key 'Escape' --eval '!!document.querySelector(".help")'
  ```
  Expect `true`, then `false`.
- **Close routes.** Close Tweaks with its button and its backdrop, and Help with `?`, its button, and its backdrop.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Open tweaks"]' --click '.tweaks-close' --eval '!!document.querySelector(".tweaks-panel")' \
    --click 'footer.status [aria-label="Open tweaks"]' --click '.tweaks-backdrop' --eval '!!document.querySelector(".tweaks-panel")' \
    --key '?' --eval '!!document.querySelector(".help")' --key '?' --eval '!!document.querySelector(".help")' \
    --key '?' --click '.help-close' --eval '!!document.querySelector(".help")' \
    --key '?' --click '.help-backdrop' --eval '!!document.querySelector(".help")'
  ```
  Expect `false, false, true, false, false, false`.

## Gotchas

- The tweak checkboxes have no id or name. Each is labelled only implicitly by its wrapping `label.tweaks-toggle`, so find them by that label's text.
- `[aria-label="Close"]` matches both the Tweaks and Help close buttons. Use `.tweaks-close` or `.help-close`.
- Status-bar segments are `span[role=button]` with no key handler. Click them; Enter or Space does nothing.
- The header `tabs` and `chain` buttons revealed by "show advanced" do nothing when clicked.
- Saved tabs mode and show advanced both break on reload of the prerendered build (see the known-defect steps). Preact hydration patches text and handlers but not attributes, so after a reload assert on attributes and placement, not text alone. A proof that only toggles within one page load does not cover the reload path.
- The Help and Tweaks backdrops close on `click`, so `--click` drives them, unlike the palette backdrop.
- The help sheet says `/` filters the catalog; it actually opens the command palette.
