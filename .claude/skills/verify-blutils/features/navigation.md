# Navigation: sidebar, home, pins, and routes

The user finds Tools through the sidebar catalog (filterable, with collapsible categories), the home page's Tool cards, pinned Tools with `g 1`–`g 9` shortcuts, and direct URLs. Navigation is client-side: history entries are pushed, and back and forward work.

## Sub-features

- `nav-sidebar-link`: clicking a sidebar row opens that Tool and marks the row's link `a.side-item.on`.
- `nav-sidebar-filter`: typing in the sidebar filter narrows rows by name, title, id, or tag.
- `nav-category-collapse`: clicking a category header collapses or expands it.
- `nav-home-card`: clicking a home-page Tool card opens it.
- `nav-pin-shortcut`: `g` then a digit jumps to that pinned Tool.
- `nav-pin-toggle`: the pin button on a row adds or removes it from the pinned section, and the next free `g N` is assigned.
- `nav-pin-chips-filtered`: while the filter has text, each pinned row's `g N` chip should still show its real shortcut. It currently does not; see the known-defect step.
- `nav-pin-reorder`: pinned rows reorder by dragging, which renumbers `g N`. Not drivable: the driver has no drag, and the keyboard route (focus the link, Space, ArrowDown, Space) left the order unchanged when tried.
- `nav-history`: browser back and forward move between visited pages without a reload.
- `nav-mobile-drawer`: at 760 px wide or less, `button.h-menu` opens the sidebar as a drawer (`.app.nav-open`), and choosing a Tool closes it.
- `nav-not-found`: an unknown path renders `not found` with status-bar label `404`.
- `nav-brand-home`: the brand link and the header breadcrumb's `blutils` link both return to home.

## How to get to it (user POV)

- The sidebar (`aside.side[aria-label="Tool catalog"]`) is always visible at widths of 761 px and up. Below that it is a drawer behind `button.h-menu`.
- Home is `/`, the brand link `a.side-brand[aria-label="Go home"]`, or the breadcrumb link `.crumb a.home-tag` (visible at every width).
- Browser back and forward.
- Press `g` then `1`–`9` while focus is outside a text field.
- Type a URL: `/<category>/<slug>` (canonical list in `dist/sitemap.xml`).

## Driving it with driver.mjs

Preconditions:

- `doctor.sh` prints `OK` for this run, and `state.env` is loaded.
- `D=.claude/skills/run-blutils/driver.mjs`.
- Pins are the defaults: json format, unix time, hash generator, base64, text diff (`g 1`–`g 5`). A fresh driver profile guarantees this.

Steps:

- **Filter and open.** Filter for `cron` and click the only row.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' \
    --type '.side-search input[aria-label="Filter tools"]=cron' \
    --eval '[...document.querySelectorAll(".side-row > a.side-item .label")].map(e => e.textContent)' \
    --click '.side-row > a.side-item' \
    --eval '[location.pathname, document.querySelector("a.side-item.on .label")?.textContent, document.querySelector(".tool-head h1")?.textContent]'
  ```
  Expect `["cron parser"]`, then `["/time/cron","cron parser","cron.parse"]`.
- **Home card.** Click the first Tool card.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' \
    --eval 'document.querySelectorAll(".home .tool-card").length' \
    --click '.home .tool-card' --eval 'location.pathname'
  ```
  Expect `41`, then `"/format/env"`. This holds only with empty recents, which a fresh profile guarantees; otherwise up to 6 recent cards come first.
- **History.** Open a card, go back, then forward.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' --click '.home .tool-card' --eval 'location.pathname' \
    --eval 'history.back(), "back"' --wait '.home' --eval '[location.pathname, document.querySelectorAll("a.side-item.on").length, document.querySelector(".seg.seg-tool").textContent]' \
    --eval 'history.forward(), "fwd"' --eval 'new Promise(r => setTimeout(r, 700))' --eval '[location.pathname, document.querySelector(".seg.seg-tool").textContent]'
  ```
  Expect `"/format/env"`, then `["/",0,"home"]`, then `["/format/env","env.json"]`.
- **Breadcrumb home.** Click the header's `blutils` crumb on a Tool page.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' --click '.crumb a.home-tag' --eval 'location.pathname'
  ```
  Expect `"/"`.
- **Mobile drawer.** At phone width, open the drawer and choose a Tool.
  ```sh
  node $D "$URL/format/json" --size 390x800 --wait '.side-row[aria-roledescription]' \
    --eval '[getComputedStyle(document.querySelector("aside.side")).visibility, document.querySelector("button.h-menu")?.getAttribute("aria-expanded"), document.querySelector(".app").classList.contains("nav-open")]' \
    --click 'button.h-menu' --eval '[document.querySelector(".app").classList.contains("nav-open"), document.querySelector("button.h-menu").getAttribute("aria-expanded")]' --shot "$RUN/nav-drawer-open.png" \
    --click '.side-row > a.side-item[href="/time/cron"]' --eval '[location.pathname, document.querySelector(".app").classList.contains("nav-open")]'
  ```
  Expect `["hidden","false",false]`, then `[true,"true"]`, then `["/time/cron",false]`.
- **Pin shortcut.** Press `g` then `2`.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' --key 'g' --key '2' \
    --eval '[location.pathname, document.querySelector(".tool-head h1")?.textContent]'
  ```
  Expect `["/time/unix","unix.time"]`.
- **Pin toggle.** On `/time/cron`, click the active row's pin button. Cron joins the pins as `g 6`.
  ```sh
  node $D "$URL/time/cron" --wait '.side-row[aria-roledescription]' \
    --click '.side-row:has(a.side-item.on) .side-pin-btn' \
    --eval 'JSON.parse(localStorage.getItem("blutils:pinned:v1"))' \
    --eval '[...document.querySelectorAll(".side-shortcut")].map(e => e.closest(".side-row")?.querySelector(".label")?.textContent + " " + e.textContent)' \
    --shot "$RUN/nav-pin-toggle.png"
  ```
  Expect the pins to end with `"time.cron"` and the shortcuts to end with `"cron parser g 6"`.
- **Category collapse.** Collapse the first category.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' \
    --eval 'document.querySelector(".side-section[role=button]").getAttribute("aria-expanded")' \
    --click '.side-section[role=button]' \
    --eval 'document.querySelector(".side-section[role=button]").getAttribute("aria-expanded")'
  ```
  Expect `"true"`, then `"false"`.
- **Not found.** Open a path that matches no route.
  ```sh
  node $D "$URL/nope/nothing" --wait '.side-row[aria-roledescription]' \
    --eval '[document.querySelector("h1.route-heading")?.textContent, document.title, document.querySelector(".seg.seg-tool")?.textContent]'
  ```
  Expect `["not found","not found — blutils","404"]`.
- **Pin chips while filtering (known defect).** Filter for `unix`, then press `g 1`.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' --type '.side-search input[aria-label="Filter tools"]=unix' \
    --eval '[...document.querySelectorAll(".side-shortcut")].map(e => e.closest(".side-row")?.querySelector(".label")?.textContent + " " + e.textContent)' \
    --eval 'document.activeElement.blur(), "blurred"' --key 'g' --key '1' --eval 'location.pathname'
  ```
  The correct result is `["unix time g 2"]`. On 2026-10-06 (commit 4c29d5e) it printed `["unix time g 1"]`, then `"/format/json"`: the chip shows the row's position in the filtered list, but `g 1` still goes to the real pin 1. Report a match with the observed output as this known defect, not as a pass.

## Gotchas

- At widths of 760 px or less the sidebar becomes a hidden drawer behind `button.h-menu`. Keep `--size` at least 761 wide, or open the drawer first.
- The pinned section repeats Tools that also appear under their category, so `a.side-item.on` has two matches for a pinned Tool. Scope selectors by row.
- Pin buttons are invisible until hover, but `--click` works without hovering.
- The `g N` shortcut has a 1.2 s window between keys. The driver's 700 ms settle fits; do not raise `--settle` past 1200 for this recipe.
- Unknown paths return HTTP 200 with the prerendered home HTML, then hydrate to `not found`. Assert the rendered heading, not the status code.
- The first home card is the first Tool in category order (`/format/env`), not the first pinned Tool.
- Category collapse state is in component memory only, so it resets on reload.
