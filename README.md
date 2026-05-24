# blutils

Local-only, in-browser developer utilities. JSON formatting, base64, hashing, regex testing, text diff, cron parsing, QR generation, and more — nothing leaves the browser.

Live at **[utils.blutarche.dev](https://utils.blutarche.dev)**

---

## Install and run

```sh
pnpm install
pnpm dev          # dev server at localhost:5173
pnpm build        # production build + prerender
pnpm test         # unit tests (Vitest)
pnpm typecheck    # tsc --noEmit
```

Node 20+, pnpm 9+.

---

## Contributing

### Adding a Tool

Each Tool lives in its own folder under `src/tools/<category>-<slug>/`:

```
src/tools/format-json/
  manifest.ts   # eager — id, name, category, slug, icon, tags, seo
  Tool.tsx      # lazy — the actual UI component
  detect.ts     # optional — clipboard Detector
  ops.ts        # optional — Chain Mode Ops
  Tool.test.ts  # algorithm tests (no DOM required)
```

The glob registry in `src/tools/_registry.ts` discovers the folder automatically — nothing else needs to change.

**PR checklist**

- [ ] `manifest.ts` exports a valid `ToolManifest` with a unique `id` and `slug`
- [ ] `category` exists in `src/categories.ts`
- [ ] `icon` is a valid `lucide-preact` export (checked at build time)
- [ ] `Tool.tsx` uses `useToolInput` for any persisted input
- [ ] Algorithm logic has `Tool.test.ts` coverage against known vectors
- [ ] `pnpm typecheck` and `pnpm build` pass

---

## Notes

### Naming canon

| Term | Meaning |
|---|---|
| **Tool** | A single utility (JSON formatter, base64 codec, …). Never "utility" or "plugin". |
| **Chain** | The sequential Op pipeline (⌘ chain mode). Never "pipe". |
| **Chrome** | Sidebar + Status Bar — the persistent shell surfaces. |
| **Workspace** | The main content area: Header, content region, and Tab strip. |

### Why Preact

Preact 10 with `preact/compat` gives a React-compatible API at ~3 KB. The app has no server component needs and no React-ecosystem dependencies that couldn't be replaced, so Preact's size advantage over React is a clean win for a cold-load-sensitive utility app.

### Why prerender

Every Tool URL ships a fully-rendered HTML file so the first paint shows real content before any JavaScript runs. The client hydrates against that markup. Prerender runs at build time via `preact-render-to-string`; there is no server process at runtime. This is the same tradeoff as a static site generator but without a separate framework.

### Plugin-shaped catalog

Adding a Tool requires no changes to any registry file. The build discovers folders under `src/tools/` via `import.meta.glob`, validates manifest uniqueness, and wires the lazy component automatically. The same glob mechanism collects clipboard Detectors and Chain Ops from optional per-Tool files. The catalog can grow to dozens of Tools without central-registry edits.
