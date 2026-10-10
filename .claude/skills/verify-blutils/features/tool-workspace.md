# Tool workspace

Every Tool page has an input panel and an output panel that update live as the user types. Around them sit mode controls, stats chips, and input that survives a reload.

The reference Tools are `format.json` (`/format/json`) and `encode.base64` (`/encode/base64`). Other Tools reuse the panel layout but have their own controls; check their `Tool.tsx` for control labels before driving them.

## Sub-features

- `tool-live-output`: typing JSON in the input renders reformatted, syntax-highlighted output.
- `tool-validity`: invalid JSON shows an `invalid` chip and a parse error in place of output, and disables copy.
- `tool-options`: the indent segment (`minify`, `2sp`, `4sp`, `tab`) and `sort keys` reshape the output.
- `tool-stats`: chips under the panels count nodes, keys, depth, and bytes in → out.
- `tool-sample`: `Load sample` fills the input with sample data, and the output renders.
- `tool-clear`: the input panel's `clear` empties the input, and the output returns to its empty state.
- `tool-persist`: input survives a reload in the same tab.
- `tool-alias`: some alias URLs preselect a mode (`/format/json-minify`, `/encode/base64-encode`, `/encode/base64-decode`). The others, such as `/format/json-format` or `/encode/b64`, open the Tool in its default mode.
- `tool-base64`: the encode/decode toggle converts text both ways, and `url-safe` swaps `+`/`/` for `-`/`_`.
- `tool-recent`: visiting a Tool records it in recents.
- `tool-copy`: `copy` puts the output on the clipboard and flashes `copied · N B` in the status bar. Clipboard permission is needed, so this one is not drivable headless.

## How to get to it (user POV)

- Click the Tool's row in the sidebar.
- Click its card on the home page.
- Pick it from the command palette (see [command-palette.md](command-palette.md)).
- Press `g` then `1`–`9` for a pinned Tool; `g 1` is json format by default.
- Open its URL directly: `/format/json`, or an alias such as `/format/json-minify`.

## Driving it with driver.mjs

Preconditions:

- `doctor.sh` prints `OK` for this run, and `state.env` is loaded.
- `D=.claude/skills/run-blutils/driver.mjs`.

Steps:

- **Live output.** Type JSON into the input. The `valid` chip appears beside the heading and the output shows the reformatted text.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' --shot "$RUN/tool-live-output-before.png" \
    --type '.two-col .panel:first-child textarea=[3,{"b":2,"a":1}]' \
    --eval '(() => { const o = document.querySelector("pre.hl-block")?.textContent; if (!o?.includes("\"b\": 2")) throw new Error("not reformatted: " + o); return o })()' \
    --eval 'document.querySelector(".tool-head .chip.ok")?.textContent.trim()' \
    --eval 'sessionStorage.getItem("blutils:input:format.json")' \
    --shot "$RUN/tool-live-output-after.png"
  ```
  Expect `eval: "valid"` and the stored input to equal the typed text. The before shot shows `Formatted JSON appears here.`; the after shot shows the highlighted output.
- **Validity.** Type broken JSON. The `invalid` chip appears, an error replaces the output, and copy is disabled.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --type '.two-col .panel:first-child textarea={"a":' \
    --eval '[document.querySelector(".tool-head .chip.bad")?.textContent.trim(), !!document.querySelector(".json-error"), !!document.querySelector("pre.hl-block"), document.querySelectorAll(".two-col .panel")[1].querySelector(".panel-h button").disabled]' \
    --shot "$RUN/tool-validity.png"
  ```
  Expect `["invalid",true,false,true]`.
- **Options.** Choose `minify`, then turn on `sort keys`. The output becomes one line with keys sorted.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --type '.two-col .panel:first-child textarea={"b":2,"a":1}' \
    --click '.seg-ctrl button:nth-child(1)' --click '.tool-head button.btn[aria-pressed]' \
    --eval '[document.querySelector("pre.hl-block").textContent, document.querySelector(".tool-head button.btn[aria-pressed]").getAttribute("aria-pressed"), document.querySelector(".seg-ctrl button.on").textContent.trim()]'
  ```
  Expect `["{\"a\":1,\"b\":2}","true","minify"]`.
- **Stats.** Type a known document and read the chips.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --type '.two-col .panel:first-child textarea={"z":26,"a":1,"nested":{"k":[3,2,1]}}' \
    --eval '[...document.querySelectorAll(".json-stats .chip")].map(c => c.textContent)'
  ```
  Expect `["8 nodes","4 keys","depth 4","37 → 85 B"]`.
- **Sample and clear.** Load the sample, then clear it. The input empties, the empty-state placeholder returns, and the stored input becomes empty.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' --click 'button[aria-label="Load sample"]' \
    --eval '[document.querySelector("textarea").value.length > 0, !!document.querySelector("pre.hl-block")]' \
    --click '.two-col .panel:first-child .panel-h .actions button' \
    --eval '[document.querySelector("textarea").value, !!document.querySelector(".tool-empty"), sessionStorage.getItem("blutils:input:format.json")]'
  ```
  Expect `[true,true]`, then `["",true,""]`.
- **Persist.** Type, reload in the same tab, and read the input back.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --type '.two-col .panel:first-child textarea={"keep":1}' \
    --eval 'setTimeout(() => location.reload(), 0), "reloading"' \
    --eval 'new Promise(r => setTimeout(r, 1500))' --wait '.side-row[aria-roledescription]' \
    --eval '[performance.getEntriesByType("navigation")[0].type, document.querySelector("textarea").value, document.querySelector("pre.hl-block")?.textContent]'
  ```
  Expect `["reload","{\"keep\":1}","{\n  \"keep\": 1\n}"]`.
- **Alias.** Open the minify alias. The `minify` segment is preselected and the page title is the canonical Tool's.
  ```sh
  node $D "$URL/format/json-minify" --wait '.side-row[aria-roledescription]' \
    --eval '[document.querySelector(".seg-ctrl button.on")?.textContent.trim(), document.title]'
  ```
  Expect `["minify","JSON Formatter & Validator — blutils"]`.
- **Alias without state.** Open an alias that sets no mode. The default `2sp` is selected.
  ```sh
  node $D "$URL/format/json-format" --wait '.side-row[aria-roledescription]' \
    --eval 'document.querySelector(".seg-ctrl button.on")?.textContent.trim()'
  ```
  Expect `"2sp"`.
- **Base64.** Switch to `decode` and type an encoded string. The read-only output holds the decoded text.
  ```sh
  node $D "$URL/encode/base64" --wait '.side-row[aria-roledescription]' \
    --click '.seg-ctrl button:nth-child(2)' \
    --type 'textarea.area.bare:not([readonly])=aGVsbG8=' \
    --eval '[document.querySelector("textarea[readonly].area.bare").value, [...document.querySelectorAll(".json-stats .chip")].map(c => c.textContent)]' \
    --shot "$RUN/tool-base64.png"
  ```
  Expect `["hello",["8 B in","5 B out"]]`.
- **URL-safe.** Encode bytes whose base64 contains `+`, then turn on `url-safe`.
  ```sh
  node $D "$URL/encode/base64" --wait '.side-row[aria-roledescription]' \
    --eval '[document.querySelectorAll("textarea").length, !!document.querySelector(".tool-empty")]' \
    --type 'textarea.area.bare:not([readonly])=??>' --eval 'document.querySelector("textarea[readonly]").value' \
    --click '.tool-head button.btn[aria-pressed]' \
    --eval '[document.querySelector("textarea[readonly]").value, document.querySelector(".tool-head button.btn[aria-pressed]").getAttribute("aria-pressed"), document.querySelectorAll("textarea").length]'
  ```
  Expect `[1,true]` (empty state), then `"Pz8+"`, then `["Pz8-","true",2]`.
- **Recent.** Reach a Tool from the sidebar and check recents.
  ```sh
  node $D "$URL/" --wait '.side-row[aria-roledescription]' \
    --type '.side-search input[aria-label="Filter tools"]=cron' --click '.side-row > a.side-item' \
    --eval '[location.pathname, JSON.parse(localStorage.getItem("blutils:recent:v1"))]'
  ```
  Expect `["/time/cron",["time.cron"]]`.

## Gotchas

- `--type` sets the value and fires `input`; it does not send keystrokes. Tools that react only to key events would not update. Every Tool checked so far listens on `input`.
- The JSON input is the page's only textarea. On `/encode/base64` there is one while the input is empty, and two once it converts; the output is `textarea[readonly]`.
- Base64's heading reads `base64`, but the loading skeleton shows the manifest title `base64.encode`. Wait for the hydration marker, not heading text.
- The stats chips sit under the panels, not in the status bar. The status bar's left slot shows the route label (`.seg.seg-tool`, e.g. `json.format`), replaced by `.seg.seg-copied` for about 1.6 s after a successful copy. Its right side holds the chain, tabs, tweaks and palette segments.
- `.output` matches nothing; old notes that use it are wrong. Output is `.tool-empty` (empty input), `pre.hl-block` (JSON), `textarea[readonly]` (base64), or `.json-error`.
- Input lives in sessionStorage only, unless the "remember inputs" tweak is on (then also localStorage `blutils:inputs:v1`, after 500 ms). A new driver invocation never sees a previous invocation's input.
- Lorem, timezone, and unix save no input; skip `tool-persist` for them.
