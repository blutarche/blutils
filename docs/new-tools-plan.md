# blutils — new tools: research, council, plan

Goal: decide which tools are worth adding next. Seed idea (user): **random string generator**.

## Hard constraints (from repo)

- **Local-only, in-browser.** No network. Web Crypto (`crypto.getRandomValues`, `crypto.subtle`, `crypto.randomUUID`) is fair game — already used by the hash tool.
- **Closed category set:** format, encode, hash, text, time, generate, inspect. A new category is a deliberate edit (`types.ts` + `categories.ts`); prefer fitting an existing one.
- **Light deps only.** Current: preact, lucide-preact, marked, prismjs, dompurify, qrcode-generator. Adding a heavy lib (js-yaml, sql-formatter, bcrypt) is a real cost and should be justified per-tool.
- **Tool anatomy:** `manifest.ts` (eager) + lazy `Tool.tsx` + optional `detect.ts` (clipboard auto-route) + optional `ops.ts` (Chain mode, string→string) + `Tool.test.ts`. Tools that contribute a clean string→string `Op` compound in value because they slot into Chain mode.

## Existing catalog (10)

JSON format · Markdown · Base64 · Hash (md5/sha) · Lorem · QR · Regex · Text Diff · Cron · Unix time.

## Research basis

Cross-referenced against IT-Tools (CorentinTh/it-tools, ~85 tools — the canonical browser dev-utility collection) pulled live from GitHub. Filtered by: not already present, fits a category, light/no deps, genuinely common dev need, bonus if chainable or clipboard-detectable.

## Candidate matrix

Scoring: **Value** (dev demand) · **Cost** (build + deps; lower better) · **Fit** (category + Chain/Detector synergy).

### Tier 1 — high value, low cost, clean fit

| Tool | Category | Why | Chain Op? | Detector? |
|---|---|---|---|---|
| **Random string / token generator** (seed) | generate | charset toggles (a-z/A-Z/0-9/symbols), length, count; `crypto.getRandomValues`. Ubiquitous. | n/a (non-deterministic) | no |
| **UUID generator** | generate | `crypto.randomUUID` (v4), optional v7; count. Trivial, constant demand. | no | no |
| **URL encode / decode** | encode | `encodeURIComponent`/`decodeURIComponent`. Trivial, pairs with Base64, perfect Chain Op + Detector. | **yes** | yes (%xx) |
| **Case converter** | text | camel/snake/kebab/Pascal/CONSTANT/Title/sentence. Light, great Chain Op. | **yes** | no |
| **JWT decoder** | inspect | split + base64url decode header/payload, render exp/iat. No verify needed (local). Very common. | no | **yes** (eyJ…) |
| **Color converter** | inspect | hex ↔ rgb ↔ hsl. Light math, high demand. | no | yes (#hex) |
| **HMAC generator** | hash | `crypto.subtle` HMAC, sits next to hash tool, no dep. | possible | no |

### Tier 2 — solid, slightly higher cost or narrower

| Tool | Category | Note |
|---|---|---|
| HTML entities encode/decode | encode | small named-entity map; chainable |
| Slugify | text | clean Chain Op; overlaps case converter a bit |
| Integer base converter (bin/oct/dec/hex) | encode | light; detector for 0x/0b |
| Text statistics (chars/words/lines/reading time) | text/inspect | light, no Op |
| ULID generator | generate | sortable IDs; small impl |
| URL parser (into components) | inspect | uses `URL`; pairs with URL encode |
| Line tools (sort/dedupe/reverse) | text | several small Chain Ops |

### Tier 3 — deferred (dep or scope cost)

JSON↔YAML (needs js-yaml) · SQL formatter (needs lib) · bcrypt (needs lib) · XML formatter · JSON↔CSV · user-agent parser.

## Council (cross-model: Codex / GPT) — adjudicated

Ran the candidate list + random-string design past Codex (off-family), blind, told to attack. Every checkable claim was **verified true against the code** before acceptance:

**Accepted (verified):**
1. **Hash detector already misroutes JWTs.** `hash-generate/detect.ts:11` returns confidence **0.92** for `^eyJ…\.eyJ…\.…`, routing JWTs to the *hash* tool. A real latent bug. → Raises JWT decoder priority; its `detect.ts` must beat 0.92 **and** the JWT branch must be deleted from the hash detector (same PR).
2. **HMAC is not a clean Chain Op.** `Op.fn` is `(input: string) => string` (`types.ts:116`) — no per-step config. HMAC needs secret+algo+encoding. → HMAC ships as a plain tool (no `ops.ts`), and only after we decide whether configured Chain steps are a thing. Sunk in order.
3. **Test infra doesn't exist.** No `vitest` dep, no `test` script, no `*.test.ts` — despite README advertising `pnpm test` and the PR checklist requiring `Tool.test.ts`. → **Blocker:** add Vitest infra (config + dep + script) as step 0, or the "tests" line in every plan is fiction.
4. **`crypto.getRandomValues` throws `QuotaExceededError` above 65 536 bytes** (16 384 `Uint32`s). → chunk generation.
5. **`crypto.randomUUID` is v4 only**; v7 needs hand-rolled RFC 9562. → ship v4 only first; defer v7.
6. **`aliases` are URL aliases, not search synonyms** (`types.ts:74`). My doc wrongly listed `password`/`token` as aliases → that publishes `/generate/password`, a security claim. → use **tags** for `token`/`nonce`/`random`; add a `/password` URL only if we build password-grade UX (entropy display, safe defaults).
7. **Don't persist generated output** via `useToolInput` (it's secret-ish) — persist *options* only.
8. **Prove rejection sampling with an injected deterministic RNG**, not a statistical distribution test (flaky, proves nothing).

**Where I push back:** Codex ranked URL-encode #1 and random-string #3 on pure value. Correct on value — but the **user pinned random-string as the starter**, so it stays first. That's a directive, not a value judgment. I also keep Color converter mid-pack (Codex sank it to #10); it's high-demand even if it's more UI.

## Recommendation (final)

**Step 0 — unblock:** add Vitest infra (`vitest` devDep + `test` script + minimal config) so `Tool.test.ts` is real. Small, but everything else depends on it.

**Build order:**
1. **Random string generator** (user seed; design below)
2. **URL encode/decode** (trivial, chainable Op, clipboard detector — highest value/effort ratio)
3. **JWT decoder** (high value **and** fixes the hash-detector misroute)
4. **Case converter** (camel/snake/kebab/Pascal/CONSTANT/Title — several clean Ops)
5. **Line tools** (sort/dedupe/trim/reverse — cheap, multiple Ops)
6. **UUID v4 generator** (v7 deferred)
7. **Color converter** (hex/rgb/hsl)
8. **HTML entities** · **Integer base converter** (light, chainable)
9. **HMAC** (only after deciding configured Chain steps)

## More candidates (round 2) + anti-bloat strategy

User philosophy: *any useful tool is welcome — keep it accessible, not bloated/confusing.* The catalog can grow large; the risk isn't tool count, it's **sidebar clutter and near-duplicates**. Two rules first, then the new ideas.

### Anti-bloat rule 1 — consolidate families behind a mode switch
The bloat trap is the converter/escape combinatorial explosion. Collapse each family into **one tool with a from→to (or target) dropdown**, not N×M entries:

- **Data format converter** — one tool, from/to ∈ {JSON, YAML, TOML, XML, CSV}. Replaces ~10 IT-Tools entries with 1. (deps: js-yaml + a small TOML; XML/CSV hand-rolled.)
- **String escaper** — one tool, target ∈ {JSON string, JS, SQL, shell, regex, HTML, URL}. Replaces a half-dozen.
- **Base/radix converter** — already one tool covering bin/oct/dec/hex (+ arbitrary).
- **Color converter** — one tool covering hex/rgb/hsl/hwb/oklch.
- **Hash & HMAC** — extend the existing hash tool with an HMAC mode rather than a new sidebar entry.

This keeps the 7-category sidebar scannable. Aliases (`/format/json-to-yaml`) + tags still give each conversion its own URL and search hit, so discoverability doesn't suffer.

### Anti-bloat rule 2 — don't ship near-duplicates
- `text-statistics` already covers a word/char counter — don't add both.
- **Random string** (raw entropy) vs **Password/passphrase** (entropy display, safe defaults, diceware) are *distinct* tools with distinct intent — keep separate (per council), but don't also add a third "secret generator".
- Bit/number inspector vs base converter overlap — fold bitwise view into the base converter.

### New high-value ideas (beyond Tier 1–3), grouped

**format / convert**
- **JSON → types** (TypeScript interface first; Go struct / Zod later) — quicktype-lite, top-tier dev demand, scoped TS gen is light. ⭐
- **Data format converter** (the consolidated one above). ⭐
- **JSON tree viewer** — collapsible/searchable; distinct from the formatter. ⭐
- **.env ↔ JSON** parser.
- **Structural JSON diff** — semantic, beyond line diff.

**encode**
- **Hex / hexdump viewer** (text ↔ hex ↔ bytes). ⭐
- **String escaper** (consolidated, above). ⭐
- **Base58 / Base32** codecs (Base58 = crypto/bitcoin addresses).
- **ROT13 / Caesar** playground (light, fun).
- **Image → base64 data URI** (local file input, never uploaded). ⭐
- **Punycode / IDN** encode-decode.

**hash**
- **HMAC mode** on the existing hash tool (not a new entry). ⭐
- **CRC32 / Adler-32** checksums (light).
- **JWT signer** (HS256 via `crypto.subtle`) — companion to the decoder, fully local. ⭐

**text**
- **Remove accents / transliterate** (`normalize('NFKD')`, zero dep).
- **Whitespace/indent normalizer** (tabs↔spaces, trim) — or fold into line tools.

**time**
- **Timezone & date converter** via `Intl.DateTimeFormat` `timeZone` — **no tz dependency**, the runtime has the data. ⭐
- **Duration / time-between** calculator.
- **Cron builder** — companion to the existing parser.

**generate**
- **Password + passphrase generator** (entropy bits, diceware wordlist ~small) — the security-grade sibling of random-string. ⭐
- **SVG placeholder image** generator (data URI, zero dep).
- **CSS toolbox** — gradient / box-shadow generator (design-y but high traffic).

**inspect**
- **IP / CIDR subnet calculator** — pure math, heavy dev demand. ⭐
- **Color contrast (WCAG) checker** — contrast ratio + AA/AAA, light math. ⭐
- **HTTP status + MIME reference** — tiny static dataset, surprisingly high traffic. ⭐
- **Chmod calculator** — light, popular.
- **Unicode inspector** — codepoint, escapes, category.
- **Hash identifier** — guess algo by length/shape.
- **User-agent parser** (was Tier 3).

⭐ = strongest new picks. My add to the build order after the original Tier-1 batch: **JSON→types, IP/CIDR calc, Timezone converter, Hex viewer, Color-contrast checker, JSON tree viewer** — all high value, light/no dep, no duplication.

## Final status — shipped (catalog 10 → 41)

All built via per-tool implementer agents, each driven execute → vet → finish: scoped Vitest in the agent, then a central gate (`pnpm test`/`typecheck`/`build`) + a top-level cross-model **Codex vet** on the logic, adjudicated, fixed, and committed. 467 tests across 31 new tool suites; Vitest infra added (it was advertised but missing).

**Shipped (31 new):**
- **generate:** random string, UUID v4, ULID, password/passphrase
- **encode:** URL, HTML entities, hex/hexdump, base (radix), Base32/Base58, ROT13/Caesar, JWT signer
- **hash:** HMAC
- **text:** case converter, line tools, slugify, text statistics
- **time:** timezone converter
- **format:** JSON→TypeScript, data-format converter (JSON/YAML/TOML/CSV), .env↔JSON
- **inspect:** JWT decoder (+ fixed hash-detector misroute), color converter, WCAG contrast, IP/CIDR subnet, JSON tree, URL parser, HTTP status, chmod, Unicode inspector, JSON diff, hash identifier

**Real bugs the cross-model vet caught & fixed (not cosmetic):** password require-each-class entropy bias (→ uniform rejection sampling + inclusion-exclusion entropy); JWT base64url validation gap; WCAG contrast ignoring alpha (→ compositing); HTML numeric entities emitting lone surrogates; base58 empty/all-zero; base32 malformed-length acceptance; data-converter destroying YAML/TOML dates + swallowing malformed CSV; .env key-injection on serialize; JSON-diff stack overflow; hash-id over-confident prefixes; ULID case-insensitive decode.

**Dependencies added** (lazy-chunk only, council-vetted): `js-yaml` (≥4.1.1, safe load), `smol-toml`, `papaparse` (with `escapeFormulae`) — all imported in lazy `engine.ts`, zero main-page cost.

**Deliberately deferred (anti-bloat / risk):** XML in the converter (entity/DTD advisory surface); cron builder (would make two cron tools — the parser already covers it); SVG placeholder, image→data-URI, transliterate (marginal). Revisit on demand.

## Random string generator — design (council-hardened)

- **Folder:** `src/tools/generate-random/` · **id:** `generate.random` · **slug:** `random` · **category:** generate · **icon:** `Dices` (lucide).
- **Tags (not aliases):** `random`, `token`, `nonce`, `string`, `id`. No `/password` URL alias unless/until password-grade UX is built.
- **Controls:** length (default 32), count (default 1); charset toggles lowercase / uppercase / digits / symbols; "exclude ambiguous" (`0 O o 1 l I`) toggle; optional custom alphabet override.
- **Alphabet semantics (must be explicit):** build the alphabet as a deduped array of code points via `Array.from(set)` (so a stray emoji/combining char doesn't corrupt indexing); **dedupe** so repeats don't bias output. "Exclude ambiguous" applies to the toggle-built set; for a *custom* alphabet, take it verbatim (deduped) and skip ambiguous-exclusion. Guard `alphabet.length < 2`.
- **Engine:** `crypto.getRandomValues` with **rejection sampling** to kill modulo bias — `max = floor(2³²/N)·N`; reject and redraw any `u32 ≥ max`, else `alphabet[u32 % N]`. **Chunk** draws into `Uint32Array(≤16384)` to stay under the 65 536-byte `getRandomValues` quota; refill on rejection. Never `Math.random()`.
- **Engine is extracted + pure**, taking an injectable `randomU32()` source so tests are deterministic.
- **Output:** N lines; copy-all + per-line copy. **Generated output is never persisted** (`useToolInput` holds *options* only, not results).
- **No `ops.ts`** (non-deterministic — wrong for a deterministic Chain). **No `detect.ts`.**
- **Tests (need Step-0 Vitest):** with an **injected deterministic RNG** — value below `max` accepted, value ≥ `max` rejected then redrawn, `% N` maps to expected index; length & count exact; ambiguous exclusion removes exactly `0 O o 1 l I`; custom alphabet deduped & verbatim; `length < 2` alphabet throws; empty charset throws.

## What council changed (visible cross-examination)

- Random-string demoted from "ship it, looks trivial" to **8 must-fix items** (quota chunking, dedup/code-point alphabet, injected-RNG tests, no persisted output, tags-not-aliases, no password claim).
- Surfaced a **pre-existing bug** (hash detector hijacks JWTs) and bundled its fix into the JWT-decoder step.
- **HMAC** reclassified from "rounds out hash, maybe a Chain Op" to "plain tool, last, blocked on a Chain-config decision."
- Added **Step 0 (Vitest infra)** — without it the PR checklist's `Tool.test.ts` requirement is unsatisfiable.
- Re-ranked the middle of the order (URL/JWT/case/line-tools up; UUID-v7 and color down).
