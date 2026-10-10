# Chain mode

Chain mode pipes one input through a sequence of operations (base64, hashes, case, line ops, URL/HTML encoding, …). Each step shows its own output, and the final output can be copied. The chain re-runs on every edit and stops at the first error. The default chain is input → base64 encode → sha-256.

## Sub-features

- `chain-open`: the Chain view opens from every entry point with the saved or default steps.
- `chain-run`: editing the input re-runs every step, and each step shows its output.
- `chain-add`: each step's `add step` opens a picker that inserts after that step. Filtering and pressing Enter (or clicking an op) inserts the first match. A filter with no match shows `no ops match`, and Esc or `close picker` closes the picker.
- `chain-remove`: `remove step` deletes a step and the chain re-runs.
- `chain-persist`: the steps persist in localStorage and the input in sessionStorage.
- `chain-error`: an op that cannot handle its input marks that step as an error. Later steps show `skipped`, and `copy final` is disabled. Fixing the input recovers the whole chain.
- `chain-reorder`: steps reorder by dragging `.chain-drag-handle`. The driver has no drag action, so this is not drivable.
- `chain-copy`: `copy final` copies the last output, and its label flips to `copied!` even headless. The label is drivable; the clipboard contents need permission and are not.
- `chain-copy-step`: every step's `copy` button copies that step's value and flips its `aria-label` to `copied`. The same clipboard caveat applies.

## How to get to it (user POV)

- Open `/chain`.
- Click `chain` in the status bar: `footer.status [aria-label="Open chain mode"]`.
- Run `Open chain` from the command palette.

## Driving it with driver.mjs

Preconditions:

- `doctor.sh` prints `OK` for this run, and `state.env` is loaded.
- `D=.claude/skills/run-blutils/driver.mjs`.
- The chain starts at the default (input → base64 encode → sha-256), which a fresh driver profile guarantees.

Steps:

- **Run.** Replace the input with `hello`. Each step's output updates.
  ```sh
  node $D "$URL/chain" --wait '.chain-drag-handle' --shot "$RUN/chain-before.png" \
    --type '.chain-step.is-input textarea.area=hello' \
    --eval '[...document.querySelectorAll(".chain-step")].map(s => [s.querySelector(".name")?.textContent, s.querySelector("pre.chain-out")?.textContent])' \
    --eval 'sessionStorage.getItem("blutils:chain.input")' --shot "$RUN/chain-after.png"
  ```
  Expect `base64 encode` → `aGVsbG8=`, `sha-256` → `333d6b3a3c1f5db6c9bdda5939b136986d170f4649172a68368d54ecb44c2ff2`, and stored input `"hello"`.
- **Add a step.** Click the `add step` button under the last step, filter for `rot13`, and press Enter. A fourth step appears as the output and its steps are saved.
  ```sh
  node $D "$URL/chain" --wait '.chain-drag-handle' --type '.chain-step.is-input textarea.area=hello' \
    --click '.chain-step.is-output + button.chain-add' \
    --eval '[!!document.querySelector(".chain-picker"), document.activeElement?.className]' \
    --type 'input.chain-picker-search=rot13' --key 'Enter' \
    --eval '[...document.querySelectorAll(".chain-step")].map(s => [s.className.trim(), s.querySelector(".name")?.textContent])' \
    --eval 'JSON.parse(localStorage.getItem("blutils:chain:v1")).steps.map(s => s.opId)'
  ```
  Expect `[true,"chain-picker-search"]`, a last entry `["chain-step is-output","rot13"]`, and `["input","b64.encode","hash.sha256","rot13"]`.
- **Error.** Append `json.format` after the hex hash. It cannot parse the hash, so that step is marked as an error.
  ```sh
  node $D "$URL/chain" --wait '.chain-drag-handle' --type '.chain-step.is-input textarea.area=hello' \
    --click '.chain-step.is-output + button.chain-add' --type 'input.chain-picker-search=json.format' --key 'Enter' \
    --eval '[...document.querySelectorAll(".chain-step")].map(s => [s.className.trim(), s.querySelector(".name")?.textContent, s.querySelector(".chain-step-h .chip")?.className, s.querySelector(".chain-out-err")?.textContent?.slice(0, 60)])'
  ```
  Expect the last entry to be `["chain-step is-error","json format","chip bad","Unexpected non-whitespace character after JSON at position 3"]`.
- **Error mid-chain and recovery.** Insert `json.format` right after the input (the first `add step`), then fix the input.
  ```sh
  node $D "$URL/chain" --wait '.chain-drag-handle' --type '.chain-step.is-input textarea.area=hello' \
    --click 'button.chain-add' --type 'input.chain-picker-search=json.format' --key 'Enter' \
    --eval '[...document.querySelectorAll(".chain-step")].map(s => [s.className.trim(), s.querySelector(".name")?.textContent, s.querySelector(".chain-step-h .chip")?.textContent.trim()])' \
    --eval 'document.querySelector(".chain-toolbar button").disabled' \
    --type '.chain-step.is-input textarea.area={"a":1}' \
    --eval '[[...document.querySelectorAll(".chain-step-h .chip")].map(c => c.className), document.querySelector(".chain-toolbar button").disabled, [...document.querySelectorAll(".chain-step")].at(-1).className.trim()]'
  ```
  Expect json format as `error` with base64 encode and sha-256 `skipped`, then `true`, then `[["chip ok","chip ok","chip ok"],false,"chain-step is-output"]`.
- **Picker empty and close.** Filter for nothing, close with Esc, reopen, then close with the button.
  ```sh
  node $D "$URL/chain" --wait '.chain-drag-handle' \
    --click '.chain-step.is-output + button.chain-add' --type 'input.chain-picker-search=zzqq' \
    --eval '[document.querySelector(".chain-picker-empty")?.textContent, document.querySelectorAll(".chain-picker-b button.btn.sm").length]' \
    --key 'Escape' --eval '!!document.querySelector(".chain-picker")' \
    --click '.chain-step.is-output + button.chain-add' --click '[aria-label="close picker"]' --eval '!!document.querySelector(".chain-picker")'
  ```
  Expect `["no ops match",0]`, then `false`, then `false`.
- **Copy labels.** Click `copy final`, then the input step's `copy`.
  ```sh
  node $D "$URL/chain" --wait '.chain-drag-handle' \
    --click '.chain-toolbar button' --eval '[...document.querySelectorAll(".chain-toolbar button")].map(b => b.textContent.trim())' \
    --click '.chain-step.is-input button[aria-label="copy"]' --eval '[...document.querySelectorAll(".chain-step button[aria-label]")].map(b => b.getAttribute("aria-label"))'
  ```
  Expect `["copied!"]`, then a list that starts with `"copied"`. This proves the button feedback only; whether the clipboard holds the value is unverified headless.
- **Remove a step.** Remove the output step.
  ```sh
  node $D "$URL/chain" --wait '.chain-drag-handle' \
    --click '.chain-step.is-output button[aria-label="remove step"]' \
    --eval '[...document.querySelectorAll(".chain-step .name")].map(e => e.textContent)'
  ```
  Expect `["input","base64 encode"]`.
- **Status-bar entry.** Click the chain segment from a Tool page.
  ```sh
  node $D "$URL/format/json" --wait '.side-row[aria-roledescription]' \
    --click 'footer.status [aria-label="Open chain mode"]' \
    --eval '[location.pathname, !!document.querySelector(".chain-view")]'
  ```
  Expect `["/chain",true]`.

## Gotchas

- The chain page has no `.main-inner` and no `.tool-head`. Wait on `.chain-drag-handle`, which appears only after hydration, not on the sidebar marker alone.
- There are trailing empty `div`s (drag-and-drop live regions) inside `.chain-stage`, so `:last-child` misses the last step. Address the last step as `.chain-step.is-output`.
- Every step has its own `button.chain-add`. `--click` takes the first match, which inserts after the input. Use `.chain-step.is-output + button.chain-add` to append.
- The chain input is `textarea.area` without `.bare`, unlike Tool inputs.
- Step chips: `.chip.ok` means ran, `.chip.bad` means error, and a plain `.chip` means skipped after an earlier error.
- On web there is no keyboard shortcut for chain mode. ⌘⇧C exists only in the desktop app's menu. The header `chain` button (behind "show advanced") has no click handler.
