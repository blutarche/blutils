# Handoff: Blutils — local-only dev utilities app

## Overview

**Blutils** is a single-page web app: a collection of local-only, in-browser developer utilities (JSON formatter, hash generator, regex tester, text diff, unix time, cron parser, markdown preview, QR encoder, lorem ipsum). It's modeled after tools like DevUtils / DevToys, but runs entirely client-side — nothing leaves the browser.

The defining UX features:

- **Sidebar tool list + main workspace** with a permanent header and status bar (IDE-style chrome).
- **Command Palette (⌘K / `/`)** with fuzzy search, smart clipboard detection (pastes a JWT? It suggests the hash tool; pastes a URL? It suggests QR; etc.), and command actions.
- **Optional multi-tab mode** for working in several tools at once (off by default — toggle via header or status bar).
- **Optional "pipe chain" mode** — chain primitive operations (encode → hash → uppercase → QR) in a vertical flow, auto-running on every change.
- **Light / dark theme**, **compact / regular density**, and an in-page tweaks panel.
- Keyboard-driven: ⌘1–9 jump to tool by index, ⌘T new tab, ⌘W close tab, ⌘F focus sidebar search, ⌘K palette, `/` palette.

## About the design files

The files in this bundle are **design references created in HTML/React** — a working prototype showing intended look and behavior. They are **not production code to copy directly**. The task is to **recreate this design in the target codebase's existing environment** (whatever framework, build system, and UI library the production app uses) using its established patterns. If no environment exists yet, choose an appropriate framework for the project (React + Vite is a sensible default for this kind of single-page tool app) and implement the design there.

The prototype uses inline Babel + React 18 from CDN, plain CSS (no preprocessor), and three small third-party libraries (`spark-md5`, `marked`, `qrcode-generator`). None of those choices are prescriptive — pick equivalents that fit the target codebase.

## Fidelity

**High-fidelity (hifi).** Colors, typography, spacing, motion, and interaction behavior are all final. The developer should match pixel-level details: exact hex values, font weights, the 1px hairline borders, the muted blue-purple accent (#9084EB dark / #5B4FCC light), the 2–4px border radii, the chrome flip in light mode. Functionality (JSON parsing, hashing, regex testing, etc.) should behave as the prototype does, but is implementation-detail; the focus of the handoff is UX + visual fidelity.

## Top-level structure

```
┌──────────┬─────────────────────────────────────────────────┐
│          │ Header  (breadcrumb · tabs/chain toggle · ⌘K)   │
│          ├─────────────────────────────────────────────────┤
│ Sidebar  │ [optional Tabs bar — only in multi-tab mode]    │
│  (chrome)│                                                 │
│          │ Main content (the active tool, or home, or pipe)│
│          │                                                 │
│          ├─────────────────────────────────────────────────┤
│          │ Status bar (chrome)                             │
└──────────┴─────────────────────────────────────────────────┘
```

CSS grid: `grid-template-columns: var(--side-w) 1fr; grid-template-rows: var(--header-h) 1fr var(--statusbar-h);`

Default sizes (dark mode):
- Sidebar width: **240px** (compact: 220px)
- Header height: **46px** (compact: 38px)
- Tabs bar height: **34px** (compact: 28px) — only visible when multi-tab is on
- Status bar height: **24px** (compact: 22px)

The sidebar and status bar are styled with a separate "chrome" color palette so they always read as system surfaces, even when the workspace flips light. See **Design Tokens** below.

---

## Design Tokens

All tokens live on `:root` and flip via `[data-theme="light"]` on `<html>`. Density flips via `[data-density="compact"]`.

### Colors — dark (default)

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0A0A0C` | Page bg |
| `--bg-2` | `#121216` | Active tab bg |
| `--bg-3` | `#1A1A20` | Elevated/hover |
| `--bg-4` | `#24242C` | Deepest elevation |
| `--surface` | `#121216` | Panel bg |
| `--surface-2` | `#1A1A20` | Panel header bg |
| `--line` | `#24242C` | Hairlines |
| `--line-2` | `#34343F` | Stronger hairline |
| `--line-hi` | `#43434F` | Hover hairline |
| `--ink` | `#F2EFEA` | Primary text (warm off-white) |
| `--ink-2` | `#C8C5BD` | Near-primary |
| `--muted` | `#8C8C94` | Secondary text |
| `--muted-2` | `#5A5A63` | Muted/decorative |
| `--muted-3` | `#3A3A44` | Most muted |
| **`--accent`** | **`#9084EB`** | **Signature muted blue-purple** |
| `--accent-hi` | `#A89FF1` | Hover/lighter accent |
| `--accent-deep` | `#5E54A8` | Depth accent |
| `--accent-soft` | `rgba(144,132,235,0.10)` | Accent bg wash |
| `--accent-bd` | `rgba(144,132,235,0.30)` | Accent borders/focus |
| `--ok` | `#6FBE83` | Valid/success |
| `--bad` | `#E26F5C` | Error/destructive |
| `--info` | `#8EE0E8` | Info chip |
| `--warn` | `#E0B85D` | Warn chip |

### Colors — chrome (sidebar + status bar)

Distinct from the main workspace, so the chrome looks like "system" even in light mode.

| Token | Dark | Light |
|---|---|---|
| `--chrome-bg` | `#07070A` | `#EDEDF0` |
| `--chrome-bg-2` | `#0E0E14` | `#E4E4E8` |
| `--chrome-bg-hover` | `#14141A` | `#DDDDE2` |
| `--chrome-border` | `#18181E` | `#D4D4D9` |
| `--chrome-border-2` | `#1F1F26` | `#DDDDE2` |
| `--chrome-ink` | `#E8E5DE` | `#0A0A0C` |
| `--chrome-ink-2` | `#C8C5BD` | `#18181D` |
| `--chrome-muted` | `#8A8A92` | `#5E5E66` |
| `--chrome-muted-2` | `#5A5A63` | `#8C8C94` |
| `--chrome-muted-3` | `#38383F` | `#ACACB2` |

### Colors — light mode overrides

```
--bg #F4F4F6   --bg-2 #FFFFFF   --bg-3 #EAEAED   --bg-4 #DCDCE0
--surface #FFFFFF   --surface-2 #FAFAFC
--line #DDDDE2   --line-2 #BFBFC6   --line-hi #8E8E96
--ink #0A0A0C   --ink-2 #18181D   --muted #4A4A52
--accent #5B4FCC   --accent-hi #4F44B5   --accent-deep #3F356E
--accent-soft rgba(91,79,204,0.08)   --accent-bd rgba(91,79,204,0.32)
```

### Typography

Three families, each with a specific job — **don't swap them**:

- **Space Grotesk** (300–700) — body text, headings inside content
- **JetBrains Mono** (300–600) — all UI chrome (tabs, sidebar items, buttons, chips, labels, kbd hints, status bar), tool titles, monospace content
- **Archivo** (700–900) — display only (the "blutils." wordmark on the home screen)

Load via Google Fonts: `Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Archivo:wght@700;800;900`.

Notable sizes:
- Tool title (`h1.tool-head h1`): **18px**, JetBrains Mono, weight 500, letter-spacing -0.01em
- Tool subtitle (`p.tool-sub`): **13px**, Space Grotesk, color `--muted`, max-width 72ch, line-height 1.55
- Sidebar item: **13px**, weight 400
- Sidebar brand name: **14px**, JetBrains Mono, weight 500
- Header breadcrumb: **12px**, JetBrains Mono
- Section labels (`[ LIKE THIS ]` style): **10px** JetBrains Mono, uppercase, letter-spacing 0.18em
- Status bar: **10.5px** JetBrains Mono, uppercase, letter-spacing 0.04em
- Home wordmark: **56px** Archivo weight 900, letter-spacing -0.04em, with `.dot` colored `--accent`
- Unix timestamp display: **44px** JetBrains Mono weight 500, tabular-nums

### Spacing & layout

- Generally on a 4–8px grid
- Main content padding: `28px 36px 56px`
- Panel header padding: `8px 14px`, height 34px
- Panel body padding: `12px 14px`
- Two-column tool layouts: `grid-template-columns: 1fr 1fr; gap: 14px;` (collapses to single column under 1100px)

### Radius

- `--r-0: 0` · `--r-1: 2px` · `--r-2: 4px` · `--r-3: 6px`
- Most surfaces use **2px or 4px** — this design is intentionally sharp-cornered

### Shadows / glows

```
--shadow-1: 0 1px 0 rgba(0,0,0,0.4)
--shadow-2: 0 12px 40px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.3)
--accent-glow: 0 0 24px rgba(144,132,235,0.28)
```

Shadows are used sparingly — only on the command palette, toast, and a couple of overlays. Most surfaces use only borders.

### Motion

- Default transition: `120ms` ease for hover (background, border-color, color)
- Palette open: `pal-in 140ms cubic-bezier(.2,.8,.2,1)` — slight Y translate + fade
- Palette backdrop: `120ms ease-out` fade
- Toast: 1.7s total — fade in 10%, hold 70%, fade out 20% with small Y motion
- **No bouncy springs anywhere.** Snappy, no overshoot.

---

## Screens / Views

### 1. Sidebar (always visible)

**Layout**: `flex column`, `width: var(--side-w)`, `background: var(--chrome-bg)`, right border `1px solid var(--chrome-border)`.

**Sections, top to bottom:**

1. **Brand row** (height = header-h, 46px). Clickable → opens Home.
   - `.logo`: 24×24 box with 1px border `--chrome-border-2`, bg `--chrome-bg-2`, contains "b." in JetBrains Mono weight 600, 11px, color `--accent`, letter-spacing -0.5px.
   - `.name`: "blutils" in JetBrains Mono weight 500, 14px, color `--chrome-ink`. Hovers to `--accent`.
   - Bottom border 1px `--chrome-border`.

2. **Filter input** (margin `10px 12px 6px`).
   - Search icon (12px) left-inset at 9px from left.
   - Input: 28px tall, 1px border `--chrome-border-2`, bg `--chrome-bg-2`, JetBrains Mono 12.5px, placeholder color `--chrome-muted-3`. Focus border → `--accent-bd`.
   - Right-inset `/` keyboard hint, JetBrains Mono 10px, framed in 1px border. (`⌘F` focuses it; Esc clears query.)

3. **Section label**: "tools" + count `9`, JetBrains Mono 10px uppercase letter-spacing 0.18em, color `--chrome-muted-2`. When filtering, becomes "N matches".

4. **Tool list** — list of 9 items, scrollable. Each item:
   - Height: ~28px (padding 6px 10px), border-radius `--r-1` (2px), 13px font.
   - Icon (14×14, color `--chrome-muted-2`) + label (lowercase tool name) + kbd hint (`⌘1`..`⌘9`).
   - Hover: bg `--chrome-bg-hover`, color → `--chrome-ink`.
   - Active (`.on`): bg `--chrome-bg-hover`, color `--chrome-ink`, **plus** a 2px-wide `--accent` rail flush against the left edge (`::before`, `left:0; top:6px; bottom:6px; width:2px`), icon color flips to `--accent`, kbd color → `--accent` @ 0.7 opacity.

5. **Footer** (height auto, padding `8px 14px`, border-top `1px solid --chrome-border`):
   - GitHub icon, "mit", spacer, "v0.3.2" — all JetBrains Mono 11px, color `--chrome-muted-3`.

**Tool registry** (drives the sidebar — 9 items, in this exact order):

| id | display name | desc | icon | shortcut |
|---|---|---|---|---|
| `json` | JSON Format | validate & beautify | json | ⌘1 |
| `diff` | Text Diff | side-by-side | diff | ⌘2 |
| `hash` | Hash Generator | md5/sha-1/256/512 | hash | ⌘3 |
| `regex` | Regex Tester | js flavor + groups | regex | ⌘4 |
| `unix` | Unix Time | live timestamp | clock | ⌘5 |
| `cron` | Cron Parser | next runs + explain | cron | ⌘6 |
| `md` | Markdown Preview | commonmark renderer | md | ⌘7 |
| `qr` | QR Generator | svg output | qr | ⌘8 |
| `lorem` | Lorem Ipsum | placeholder text | lorem | ⌘9 |

(All names render in **lowercase** in the sidebar — see `.label` style.)

---

### 2. Header

**Layout**: flex row, `padding: 0 18px`, `border-bottom: 1px solid var(--line)`, bg `--bg`.

**Contents (left → right):**
- **Breadcrumb** (`.crumb`): JetBrains Mono 12px, color `--muted-2`. Format: `blutils` (clickable, hovers to `--muted`) + `/` (in `--muted-3`) + `<active tool name in dot-case>` in bold `--ink`. E.g. `blutils / json.format`, or `blutils / pipe.chain`, or `blutils / home`.
- **Spacer** (flex:1).
- **Tab toggle** (`.h-btn`, only shown when `showAdvanced` tweak is on): pill button, 26px tall, 1px border `--line`, transparent bg. Icon `plus` + "tabs". On state: bg `--ink`, text `--bg`, border `--ink`.
- **Chain toggle** (same): icon `pipe` + "chain". Same on-state.
- **Commands button**: icon `search` + "commands" + `⌘K` kbd hint inline.

`.h-btn` typography: 12px JetBrains Mono, color `--muted`. Hover bg `--bg-3`, color → `--ink`, border → `--line-2`.

---

### 3. Tabs bar (advanced mode only)

Only visible when `multiTab` is true. Sits between header and main content.

**Layout**: `display: flex; align-items: flex-end; height: var(--tabs-h); padding: 4px 6px 0; border-bottom: 1px solid var(--line); gap: 2px;` Horizontally scrolls if overflowing, scrollbar hidden.

**Each tab** (`.tab`):
- Height: `var(--tabs-h) - 4px` (30px default)
- Padding: `0 10px 0 12px`
- Border-radius: `--r-1 --r-1 0 0` (top corners only)
- Transparent border by default; **active tab** has `1px solid --line` border, bg `--bg-2`, and a `::after` pseudo at the bottom that paints over the parent's bottom border with `--bg-2` to make the tab "merge" with the content below.
- Contents: icon (12px, `--muted-2`; active → `--accent`) + name (mono 12px, ellipsis on overflow) + optional `.dirty` dot (5×5, `--accent`) + close `×` button (14×14, opacity 0 until tab hover/active).
- **Double-click on the name → inline rename**: replaces `.name` with a small text input outlined in `--accent-bd`, focused + selected on mount. Enter commits, Esc cancels, blur commits. Empty value reverts to default name.

**Tab names** derive from the tool: `JSON Format` → `json.format`. Pipe tab is always `pipe.chain`; home tab is `home`.

**Plus button** (`.tab-new`): 28×28, ghost button at the end. Opens the command palette to pick a tool. Hover bg `--bg-3`.

---

### 4. Status bar (always visible, at bottom)

**Layout**: flex row, height 24px, padding `0 14px`, gap 14px, bg `--chrome-bg`, border-top `1px solid --chrome-border`, color `--chrome-muted-2`, font JetBrains Mono 10.5px uppercase letter-spacing 0.04em.

**Segments (left → right):**
- `<dot> local` — color `--ok`, 5px dot of currentColor. (Indicates "everything runs locally", never connects.)
- Current context: `<tool-name>` in `--chrome-muted` (mono case dotted name) — or `<pipe-icon> chain` in chain mode — or `home`.
- Spacer.
- `<pipe-icon> chain` — clickable to toggle pipe mode.
- `<plus-icon> tabs on` or `single` — clickable to toggle multi-tab.
- `<kbd>⌘K</kbd> palette` — clickable to open palette. `kbd` element: 1px border `--chrome-border-2`, padding `0 3px`, border-radius `--r-1`.

Each segment hovers from `--chrome-muted-2` → `--chrome-ink`.

---

### 5. Main content area

**Layout**: flex column inside grid-area `main`, bg `--bg`, scrollable inner (`.main-inner`) with thin scrollbar (`--line-2` thumb on transparent track).

**Inner padding**: `28px 36px 56px`.

**Every tool starts with a `.tool-head` row + `.tool-sub` paragraph:**

- `.tool-head`: flex row, gap 10px, margin `0 0 6px`. Contains an `<h1>` (18px JetBrains Mono weight 500, dot-cased — e.g. `json.format`, `hash.generate`), then 0–N status chips, then a flex spacer, then 0–N action buttons / segmented controls.
- `.tool-sub`: 13px Space Grotesk, color `--muted`, max-width 72ch, line-height 1.55, margin `0 0 22px`. One-line description of the tool.

Most tools then render a `.two-col` grid (input panel | output panel) or a single full-width panel.

---

### 6. Home screen

Shown when no tool is selected (initial state, or when "home" tab is active).

- **`.home-wordmark`**: "blutils." in Archivo 900, **56px**, letter-spacing -0.04em. The trailing `.` is wrapped in `<span class="dot">` colored `--accent`.
- **`.home-sub`**: ~14.5px Space Grotesk, color `--muted`, max-width 60ch. Copy: *"local-only, lightning-fast developer utilities. open-source. everything runs in your browser — nothing leaves it."*
- **`.home-cta`**: a single-row panel — 1px border `--line`, bg `--surface-2`, radius `--r-2`, padding `14px 18px`. Contains search icon, hint text (`press ⌘K or / to jump to any tool`), and a primary button "open command palette". The `<span class="kbd">` chips inside the hint render like little keyboard keys (1px border `--line`, bg `--bg-3`, padding `1px 5px`).
- **`.home-section`** label: "tools · 8".
- **`.home-grid`**: `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px;` — 8 cards, one per featured tool. Each card (`.home-card`):
  - 1px border `--line`, bg `--surface`, radius `--r-2`, padding `14px 16px`.
  - `.top`: flex row with the tool icon (color `--accent`) and the tool name in JetBrains Mono 13px weight 500, color `--ink`.
  - `.desc`: 12px JetBrains Mono, color `--muted` — the short description.
  - Hover: border → `--accent-bd`, bg → `--surface-2`. (No translateY — just a quiet shift.)
  - Click → opens the tool.

---

### 7. Tools — common patterns

All tools follow the same internal vocabulary:

**`.panel`** — the basic content container:
- 1px border `--line`, bg `--surface`, radius `--r-2`, overflow hidden.
- **`.panel-h`** header strip: 34px tall, padding `8px 14px`, bg `--surface-2`, border-bottom 1px `--line`. JetBrains Mono 10.5px **uppercase** letter-spacing 0.14em color `--muted`. Right side `.actions` flex row, normal case, holds ghost buttons.
- **`.panel-b`** body: padding `12px 14px`.

**`.btn`** — primary button:
- 28px tall, 1px border `--line`, bg `--surface`, color `--ink`, radius `--r-1`, padding `5px 12px`, JetBrains Mono 12px.
- `.btn.primary` — bg `--accent`, color white, border `--accent`. Hover → `--accent-hi`.
- `.btn.ghost` — transparent bg + border, color `--muted`. Hover bg `--bg-3`, color `--ink`.
- `.btn.sm` — 22px tall, 11px, padding `2px 8px`.

**`.seg-ctrl`** — segmented control:
- Inline flex, 28px tall, 1px border `--line`, radius `--r-1`, overflow hidden.
- Each button: transparent bg, JetBrains Mono 11.5px, color `--muted`, right border `1px solid --line` (except last). Hover bg `--bg-3`. On state (`.on`) bg `--bg-3`, color `--ink`.

**`.chip`** — small status chip:
- Inline flex, padding `2px 8px`, 1px border `--line`, radius `--r-1`, JetBrains Mono 11px, color `--muted`, bg `--surface`.
- Variants: `.chip.ok` (green), `.chip.bad` (red), `.chip.info` (cyan), `.chip.accent` (purple). Each variant tints border + bg + text from the corresponding token at low opacity.

**`.kbd`** — keyboard hint:
- JetBrains Mono 10.5px, padding `1px 5px`, 1px border `--line`, radius `--r-1`, bg `--bg-3`, color `--muted`.

**`.input` / `.area`** — form fields:
- 1px border `--line`, bg `--surface`, color `--ink`, radius `--r-2`, padding `8px 10px`.
- JetBrains Mono 12.5px, line-height 1.5.
- `.area` adds `min-height: 200px`, `resize: none`.
- Focus border → `--accent-bd`.
- `.area.bare` removes border + radius and sits inside a panel body (used for the main textareas inside each tool).

**`.kv`** — definition list grid:
- `display: grid; grid-template-columns: 110px 1fr; gap: 6px 14px;` Mono 12.5px. `dt` color `--muted`, `dd` color `--ink`, word-break: break-all.

---

### 8. Per-tool layouts

Each tool's `cmp` name maps to a React component in `blutils-tools.jsx`.

#### `json` — JSON Format

- `tool-head`: `h1` "json.format" + valid/invalid chip + segmented control (`minify | 2sp | 4sp | tab`) + a `btn` "sort keys" (toggles a checkmark icon).
- Two-column: **input panel** (bare textarea, sample button + clear button in header) | **output panel** (read-only textarea, copy button in header).
- If invalid: replaces output with `.json-error` block — left-border 2px `--bad`, bg `rgba(226,111,92,0.06)`, mono 12px text in `--bad`.
- Below the panels: `.json-stats` row of chips — `N nodes`, `N keys`, `depth N`, `bytesIn → bytesOut B`.

#### `diff` — Text Diff

- `tool-head`: title + `+N` (ok chip) + `−N` (bad chip) + `N unchanged` (neutral chip), then "ignore whitespace" + "swap" ghost buttons.
- Two-column inputs (panels labeled "A — original" / "B — modified"), each with a bare textarea min-height 140px.
- Below: **`.diff-grid`** — `grid-template-columns: 36px 1fr 36px 1fr;` 1px border `--line`, radius `--r-2`.
  - `.gut` columns (line numbers): right-aligned, JetBrains Mono, `--muted-2`, bg `--surface-2`.
  - `.ln` columns (line content): mono 12px, `--ink`, white-space pre-wrap.
  - `.add` row tint: bg `rgba(111,190,131,0.08)`, gutter tinted ok-color.
  - `.del` row tint: bg `rgba(226,111,92,0.08)`, gutter tinted bad-color.
  - `.empty` row: bg `--surface-2`, `--muted-2`.

#### `hash` — Hash Generator

- `tool-head`: title + `N bytes in` neutral chip.
- Sub: copy about local SubtleCrypto, MD5 weak warning.
- **Input panel**: bare textarea min-height 96px.
- **Digests panel**: `.hash-row` for each of MD5/SHA-1/SHA-256/SHA-512:
  - Grid `90px 1fr auto`, gap 12px, padding `9px 0`, border-top 1px `--line` (no top border on first).
  - `.h-name`: mono 11px uppercase letter-spacing 0.08em, `--muted`. The "MD5" row has an inline mini bad-chip "weak".
  - `.h-val`: mono 12px word-break break-all, `--ink`. Spinner (`<span class="spin">`) while computing.
  - Copy button on the right.

#### `unix` — Unix Time

- `tool-head`: title + "UTC" chip + spacer + pause/resume ghost button.
- **Now panel**: header "now" + copy action.
  - `.now-stamp`: **44px** JetBrains Mono weight 500, tabular-nums, letter-spacing -0.02em — current epoch, grouped with thin spaces every 3 digits.
  - `.now-row`: flex wrap, 11.5px mono, `--muted`, with bolded subvalues (`--ink`) — date, UTC time, weekday + week #, local time.
- **Two-column** below:
  - `unix → date` panel: number input + `.kv` showing ISO 8601 / RFC 2822 / Local / Relative.
  - `date → unix` panel: text input (parses with `new Date()`) + `.kv` showing seconds / millis / micros / weekday.

#### `regex` — Regex Tester

- `tool-head`: title + match-count chip (`N matches` or `invalid`) + segmented control of flag toggles `g i m s u y`.
- **Pattern panel**: `panel-h` "pattern". Body: `/` separator (`--muted`) + bare input + `/{flags}` (`--muted`). On invalid: shows `.json-error` block.
- **Two-column** below:
  - **Test text panel**: bare textarea (min-height 200px), then a dashed top-border divider, then `.regex-text` highlight pane (`white-space: pre-wrap`, mono 12.5px line-height 1.6). Matches highlighted with `<mark>`: bg `--accent-soft`, color `--accent-hi`, border-bottom 1px `--accent`.
  - **Matches panel**: list of matches, each in its own row with `#N` chip + the match text in mono + `@ index` on the right. Named capture groups render as a small `.kv` with `grid-template-columns: 70px 1fr` below the match.

#### `cron` — Cron Parser

- `tool-head`: title + valid/invalid chip.
- **Expression panel**: 1 input + a wrap of chip-style preset buttons (`every minute`, `every 15 min`, `hourly`, `weekdays @ 9am`, `sun @ 2:30am`, `1st of month`).
- **`.cron-explain`** callout (if valid): padding `12px 16px`, bg `--accent-soft`, 1px border `--accent-bd`, radius `--r-2`. Body 13.5px Space Grotesk, color `--ink`, line-height 1.55. Starts with a bolded `↳` in `--accent-hi`. The expanded sentence ("At minute every past hour …, on …, in …, on …").
- **Next 6 runs panel**: an `<ol class="cron-runs">` (list-style none) — each `<li>` is a 3-column grid `40px 1fr auto` with `#N` (muted), the formatted datetime (`--ink`), and a relative-time hint (`in 5 min`, etc.) on the right. Border-top 1px `--line` between rows.

#### `md` — Markdown Preview

- `tool-head`: title + `N lines` chip.
- **Two-column**: source panel (bare textarea min-height 380px) | preview panel (`.md-prev`).
- `.md-prev` styles:
  - 14px Space Grotesk, line-height 1.6, color `--ink`.
  - `h1`/`h2`/`h3` in Archivo, weight 700, letter-spacing -0.02em; sizes 24/19/16.
  - `code`: mono 12.5px, bg `--bg-3`, padding `1px 5px`, radius `--r-1`, color `--accent-hi`.
  - `pre`: bg `--bg-3`, padding `12px 14px`, radius `--r-2`. Code inside is full-color `--ink` and unstyled.
  - `blockquote`: 2px left border `--accent`, color `--muted`.
  - Links: `--accent-hi`, underlined, text-underline-offset 3px.

#### `qr` — QR Generator

- `tool-head`: title + `N chars` chip.
- **Two-column**: input panel (bare textarea) | QR panel.
- **`.qr-out`**: grid-place-center, padding 18px, bg `--surface-2`, 1px border `--line`, radius `--r-2`. Inside is a 220×220 SVG. **In dark mode, the rendered QR's white rect is restyled to `--surface` and black rects to `--ink` via a CSS rule that targets `rect[fill="#ffffff"]` / `rect[fill="#000000"]` inside `.qr-out svg`** — so the QR matches the theme.
- Below the QR: a small mono caption "error correction · M · auto version".

#### `lorem` — Lorem Ipsum

- `tool-head`: title + word-count chip + "regenerate" ghost button.
- **Controls panel**: a single panel-body row with a segmented control (`words | sentences | paragraphs`), a `count` label, a +/- stepper, and a range input.
- **Output panel**: the generated text, white-space pre-wrap, line-height 1.6.

---

### 9. Command Palette

**Trigger**: ⌘K, `/`, the header "commands" button, or the status bar segment. On open, the app reads the user's clipboard (if smartHints tweak is on) and passes it as `paste` to detect content type.

**Layout**:
- Full-screen `.palette-backdrop` — `position: fixed; inset: 0;` bg `rgba(10,10,12,0.6)` with 3px backdrop-filter blur (light mode: `rgba(15,15,20,0.32)`). `z-index: 100`. Fades in 120ms.
- Centered `.palette` — `width: 600px; max-width: calc(100vw - 32px); max-height: 70vh;` positioned `padding-top: 12vh;` from the top of the backdrop (so it sits ~12vh down, not centered vertically).
- `.palette` style: bg `--surface`, 1px border `--line-2`, radius `--r-3` (6px), shadow `--shadow-2`. Slides in from -6px Y with a 140ms `cubic-bezier(.2,.8,.2,1)` ease.

**Internal structure**:

1. **Input row** (`.palette-input-row`, padding `14px 16px`, border-bottom 1px `--line`):
   - Search icon, large input (mono 14.5px, color `--ink`, placeholder `--muted-2`), `esc` kbd hint.

2. **Detect strip** (only if clipboard content matched a kind):
   - `.palette-detect`: padding `8px 16px`, bg `--accent-soft`, border-bottom 1px `--line`, mono 11.5px color `--accent`. Sparkle icon + "**Detected:** <label> —" + a small accent button "open in <tool>" + right-aligned "from clipboard" hint.
   - Detection rules (see `blutils-palette.jsx` `detectKind`):
     - Starts with `{` or `[` and parses as JSON → "JSON object detected" → `json`
     - JWT shape `eyJ…eyJ…[…]` → "JWT-shaped token" → `hash`
     - 64/40/32 hex chars → SHA-256/SHA-1/MD5 hex → `hash`
     - `1[6-9]\d{8}` → unix sec timestamp → `unix`
     - `1[6-9]\d{11}` → unix ms timestamp → `unix`
     - `https?://…` → "URL — encode as QR?" → `qr`
     - 5 space-separated cron fields → "cron expression" → `cron`
     - Two blocks separated by `\n---\n` → "two-block diff" → `diff`
     - Has `^#` heading or `^[*-] ` bullet → "looks like markdown" → `md`

3. **List** (`.palette-list`, scrollable, padding 6):
   - Sections rendered as `.pal-section` labels (mono 10px uppercase letter-spacing 0.18em, `--muted-2`, padding `12px 12px 4px`): "Tools" then "Commands".
   - Each `.pal-item`: padding `8px 10px`, radius `--r-2`, flex row with icon (18px col, color `--muted`, active `--accent`) + name (mono 13px `--ink`) + desc (12px `--muted`, left-margin 6px) + optional `.k.kbd` at the right edge.
   - Selected item (`.pal-item.on`): bg `--bg-3`. Tracks both keyboard ↑/↓ and mouse hover (mouseenter sets the selection).
   - Matched substring of the query is wrapped in `<mark>`: bg `--accent-soft`, color `--accent-hi`, padding 0.

4. **Footer** (`.palette-foot`, padding `8px 16px`, border-top 1px `--line`, bg `--surface-2`, mono 10.5px `--muted`): "↑↓ navigate", "↩ open", "esc close", spacer, "N results".

**Fuzzy match**: substring match scores 1000−index; letter-order match scores 500 − 10·(range count); see `fuzzyMatch()` in `blutils-palette.jsx`.

**Built-in commands** (alongside tools):
- "Go home"
- "Toggle multi-tab mode"
- "Open pipe chain"
- "Toggle theme" (light ↔ dark)
- "Copy permalink to current tool" (just toasts "Permalink copied")

---

### 10. Pipe Chain mode

Activated via header "chain" toggle, status bar segment, or palette command. Replaces the main content area entirely (no tool, no tabs bar tabs are shown inside this view).

**Layout**:

1. **`.pipe-toolbar`** — flex row across the top of `main`, padding `10px 18px`, border-bottom 1px `--line`, bg `--surface-2`. Contains:
   - Pipe icon + "pipe chain" label (color `--ink`, weight 500)
   - "· N steps · auto-runs on every change" in `--muted`
   - Spacer
   - "copy final" ghost button
   - "save recipe" primary-ish button (copies a Unix-pipe-style string like `"input" | b64.encode | sha256`)
   - "exit chain" ghost button

2. **`.pipe-stage`** — vertical center-aligned column, padding `28px 28px 80px`, scrollable, flex column.

3. **Each step** is a `.pipe-step` panel (max-width 780px, full width inside the stage):
   - 1px border `--line`, bg `--surface`, radius `--r-2`.
   - Variant borders: `.is-input` → cyan tint border (`rgba(142,224,232,0.4)`); `.is-output` (last successful step) → green tint border (`rgba(111,190,131,0.4)`); `.is-error` → red tint border (`rgba(226,111,92,0.4)`).
   - **`.pipe-step-h`** header: padding `8px 14px`, border-bottom 1px `--line`, bg `--surface-2`, mono 11.5px. Contains:
     - `.num` — "step N /" in 11px color `--accent` weight 500.
     - Icon (13px) + operation name (color `--ink`, weight 500).
     - Spacer.
     - Status chip (ok/error) and an `×` ghost button (remove step; hidden on input step).
   - **`.pipe-step-b`** body: padding `12px 14px`.
     - **Input step**: shows a `.area` textarea, min-height 60px, with the user's string. Editing re-runs the whole chain.
     - **QR step**: renders a 160×160 inline SVG QR.
     - **Other steps**: a mono pre-wrap output (max-height 140px, scrollable) — `--ink` on success, `--bad` on error.

4. **Between steps**: a tiny vertical line + downward-pointing triangle (`.pipe-link`: 1px wide, 22px tall, bg `--line-2`, with a `::after` triangle made of borders) — this is the "flow arrow" connector.

5. **Between steps and at the end**: a `.pipe-add` button — dashed 1px border `--line-2`, transparent bg, mono 11.5px `--muted`, "+ add step". Hover: color → `--accent`, border → `--accent-bd`. Clicking opens an inline picker panel (same panel shape) that shows a flex wrap of `.btn.sm` buttons for every available operation.

**Operations available** (each takes a string → string; some `async`):
- `lorem` (source) — emits a fixed lorem sentence
- `b64.encode`, `b64.decode`
- `url.encode`, `url.decode`
- `upper`, `lower`
- `reverse`
- `json.format`, `json.minify`
- `sha256`, `sha1` (use `crypto.subtle.digest`)
- `count` (returns length as a string)
- `qr` (renders QR of the previous step's output; passes value through unchanged)

The chain auto-runs after every state change. If a step throws, the chain halts at that step and the rest are not rendered.

---

### 11. Toast

A single toast at a time, used for copy confirmations and "Recipe copied".

- `position: fixed; left: 50%; bottom: 44px; transform: translateX(-50%);`
- bg `--ink`, color `--bg`, padding `8px 16px`, radius `--r-2`, mono 11.5px letter-spacing 0.02em, shadow `--shadow-2`, z-index 200.
- Animation `toast 1.7s ease forwards` — fades in (10%) with 6px Y rise, holds (10–80%), fades out (80–100%) with 4px Y rise.

---

### 12. Tweaks Panel

The in-page settings panel (powered by the prototype's `tweaks-panel.jsx` — left in for reference, but in production this maps to your app's settings/preferences surface, not necessarily a draggable floating panel).

**Tweakable values:**
- `theme`: `light` | `dark` (radio)
- `density`: `compact` | `regular` (radio) — flips `data-density` on `<html>`
- `showAdvanced`: boolean — toggles the header tab/chain buttons
- `smartHints`: boolean — enables clipboard-detection in the palette

Plus two action buttons in the prototype: "Open command palette" and "Open pipe chain".

---

## Interactions & Behavior

### Global keybindings (registered on `window`)

| Key | Action |
|---|---|
| ⌘/Ctrl + K | Open command palette (also reads clipboard for detection) |
| `/` | Open command palette (when not focused in an input/textarea) |
| ⌘/Ctrl + 1..9 | Jump to nth tool in the registry |
| ⌘/Ctrl + T | Open new-tab picker (palette) — only when `showAdvanced` is on |
| ⌘/Ctrl + W | Close current tab — only when multi-tab is on |
| ⌘/Ctrl + F | Focus the sidebar filter input |
| Esc | Close palette / clear sidebar filter / cancel inline rename |
| ↑ / ↓ | Navigate palette list |
| ↩ | Open selected palette item |
| Double-click on tab name | Inline rename |

### State model

App-level state lives in the `App` component:

```ts
type Tab =
  | { tabId: number, special: 'home' }
  | { tabId: number, toolId: ToolId, customName?: string }
type AppState = {
  tweaks: { theme, density, showAdvanced, smartHints },
  paletteOpen: boolean,
  paletteSeed: string,           // text passed to palette for detection
  multiTab: boolean,
  pipeMode: boolean,
  toast: { msg, key } | null,
  tabs: Tab[],
  activeIdx: number,
}
```

Behaviors:

- **Opening a tool in single-tab mode** replaces the only tab.
- **Opening a tool in multi-tab mode** focuses an existing tab if it's already open; otherwise appends.
- **Closing the last tab** auto-creates a fresh "home" tab so the user is never tabless.
- **Turning multi-tab off** collapses tabs to whichever was active.
- **Pipe mode** is exclusive — it replaces the content area; toggling it off returns to the active tab/home.

### Theme + density application

Two attributes on the document root: `data-theme="light|dark"` and `data-density="compact|regular"`. CSS scopes overrides via `[data-theme="light"]` and `[data-density="compact"]` selectors on `:root`.

### Smart clipboard detection

On palette open, the app calls `navigator.clipboard.readText()` (graceful catch on failure / permission denial), then passes the text as `paste` to the palette. The palette runs `detectKind(paste)` and shows the detect strip when a match is found. Clicking the strip's button opens the relevant tool, **with that text pre-seeded** as the initial input (each tool accepts an `initialInput` prop). The palette closes on selection.

### Per-tool behaviors of note

- **JSON Format** validates on every keystroke (debounced by React's batching only — re-renders on every change). `sortKeys` is a deep alphabetical sort of object keys, recursively.
- **Diff** uses an LCS-based line diff (`lcsDiff` in `blutils-tools.jsx`); caps at `m * n > 250_000` for performance. Side-by-side pairing pulls deletions/additions into a single row when possible.
- **Hash** uses `crypto.subtle.digest('SHA-1' | 'SHA-256' | 'SHA-512', ...)` for everything except MD5, which uses the `SparkMD5` global from CDN.
- **Unix Time** ticks every 1000ms via `setInterval`; pausable.
- **Regex** builds `new RegExp(pattern, flags)` and either iterates `exec()` with `g` or runs once. Highlights matches inline via `<mark>` spans.
- **Cron**: 5-field cron, fully expanded into minute/hour/day/month/dow integer arrays; iterates forward minute by minute (safety cap 1 year) to find the next 6 runs.
- **Markdown**: uses `window.marked.parse(text)` and `dangerouslySetInnerHTML` (in production, sanitize the output appropriately).
- **QR**: uses `window.qrcode(0, 'M')` from `qrcode-generator`; auto type-number, error correction M.
- **Lorem**: a fixed word bank; `regenerate` bumps a seed counter.

### Pipe chain behavior

Whenever `chain` changes, an async `useEffect` re-runs every step in sequence, accumulating `results[]`. The render reads `results[i]` per step; once a step errors, no subsequent results are shown. The final successful step is styled `.is-output` (green border). Step 1 (the `input` source step) is styled `.is-input` (cyan border).

---

## Assets

The prototype uses no image assets. **All icons are inline SVG** drawn in `Icon` (in `blutils-tools.jsx`) — a single tiny stroke icon set (`copy`, `check`, `x`, `play`, `pause`, `plus`, `minus`, `arrow-right`, `arrow-down`, `search`, `swap`, `sparkle`, `json`, `diff`, `hash`, `regex`, `clock`, `cron`, `md`, `qr`, `lorem`, `pipe`, `settings`, `sun`, `github`, `eye`, `history`). All are 16×16 viewbox, 1.4px stroke, `currentColor`, no fills.

For production, you may want to either:
1. Keep an inline SVG icon set (easy to control color via `currentColor` and stroke-width).
2. Pull from **Lucide** — the design system's recommended set; 2px stroke and the visual vocabulary matches.

---

## Third-party dependencies (in the prototype)

| Lib | Used by | Notes |
|---|---|---|
| React 18.3 + ReactDOM | everything | replace with your codebase's React version |
| Babel Standalone | inline JSX | not for production — compile your JSX at build time |
| `spark-md5@3.0.2` | Hash tool (MD5) | swap for your codebase's preferred MD5 lib (or drop MD5 entirely) |
| `marked@12.0.0` | Markdown tool | swap as you like; **sanitize output before rendering** |
| `qrcode-generator@1.4.4` | QR tool & pipe chain | any QR lib works |

Fonts via Google Fonts CDN: `Space Grotesk`, `JetBrains Mono`, `Archivo`.

---

## Files in this bundle

| File | What it is |
|---|---|
| `Blutils App.html` | Entry HTML. Loads fonts, libs, and JSX modules. |
| `blutils-styles.css` | All styles. 1030 lines. Tokens at the top, then app shell, then per-component blocks. **Source of truth for visuals.** |
| `blutils-app.jsx` | App shell: sidebar, header, tabs bar, status bar, command-palette wiring, keybindings, tweaks panel. Defines the `TOOLS` registry. |
| `blutils-tools.jsx` | All 9 tool components (`JsonTool`, `HashTool`, etc.) + the `Icon` set + the `HomeTool`. ~950 lines. |
| `blutils-palette.jsx` | `Palette` component + fuzzy matcher + `detectKind` clipboard heuristics. |
| `blutils-pipe.jsx` | Pipe-chain mode + operation registry. |
| `tweaks-panel.jsx` | The prototype's tweak/settings panel. In production, replace with your app's preferences surface. |

Run the prototype locally by opening `Blutils App.html` in a browser — no build step required.

---

## Recommended implementation order

1. **Build the shell first** — token CSS, sidebar, header, status bar, main grid, and home screen. Get the chrome flip (sidebar/status separate from main bg) and the light/dark switch working.
2. **Wire up the tool registry + sidebar navigation** with one stub tool. Get ⌘1..9 + sidebar filter + Esc-to-clear working.
3. **Build the command palette** (without smart-detection). Get fuzzy match, ↑/↓ keyboard nav, mouse-hover selection, and the section structure right.
4. **Implement tools one at a time.** Start with `json` (simplest), then `hash`, `unix`, `regex`, `diff`, `lorem`, `qr`, `md`, `cron`.
5. **Add the toast helper** and copy-to-clipboard plumbing.
6. **Smart clipboard detection** in the palette — bolt on once the tools accept `initialInput` props.
7. **Multi-tab mode** + the tabs bar + inline rename.
8. **Pipe chain mode** — last, since it composes operations from existing tools' helper functions.
9. **Tweaks/settings surface** — map to your app's preferences UX (not necessarily a floating panel).

Good luck. The visual language is intentionally quiet and sharp — resist the urge to add gradients, rounded-corner cards, or large radii. Keep borders 1px, radii 2–4px, type tight, accent rare (1 in 10 surfaces).
