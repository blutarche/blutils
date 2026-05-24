/**
 * Static site generator for blutils.
 *
 * Runs after `vite build` (client) and `vite build --ssr` (server).
 * For every registered route (Home, Chain, each Tool, each Tool
 * alias) emits a per-route index.html under dist/<path>/ with:
 *
 *   - the fully-rendered App tree (shell, Sidebar, Header,
 *     Workspace content) inside #root, so first paint shows
 *     content before hydration
 *   - per-route <title>, <meta name="description">, and OG meta
 *     pulled from the manifest.seo of each Tool
 *   - the build's CSS inlined into <head>, so first paint
 *     does not block on a CSS network request
 *
 * After all routes, emits:
 *   - dist/sitemap.xml  (canonical routes only, no aliases)
 *   - dist/robots.txt
 *
 * Output paths follow the canonical URLs:
 *   /                  → dist/index.html
 *   /chain             → dist/chain/index.html
 *   /format/json       → dist/format/json/index.html
 *   /format/json-minify → dist/format/json-minify/index.html  (alias)
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distClient = join(root, 'dist')
const distServer = join(root, 'dist-server')

if (!existsSync(distClient) || !existsSync(distServer)) {
  console.error(
    'prerender: dist/ or dist-server/ missing. run `vite build` and `vite build --ssr` first.',
  )
  process.exit(1)
}

const templatePath = join(distClient, 'index.html')
const rawTemplate = readFileSync(templatePath, 'utf-8')

// ── 1. inline CSS ────────────────────────────────────────────
const cssLinkPattern = /<link[^>]*rel="stylesheet"[^>]*href="(\/[^"]+\.css)"[^>]*\/?>/i
const cssMatch = rawTemplate.match(cssLinkPattern)
let templateWithInlineCss = rawTemplate
if (cssMatch) {
  const href = cssMatch[1]
  const cssPath = join(distClient, href)
  if (existsSync(cssPath)) {
    const css = readFileSync(cssPath, 'utf-8')
    templateWithInlineCss = rawTemplate.replace(
      cssMatch[0],
      `<style data-inline-css>${css}</style>`,
    )
  }
}

// ── 2. import the SSR bundle ──────────────────────────────────
const serverEntryUrl = pathToFileURL(
  join(distServer, 'entry-server.js'),
).href
const { render, allRoutePaths, canonicalRoutePaths } = await import(serverEntryUrl)

// ── 3. helpers ────────────────────────────────────────────────
const HOST = 'https://utils.blutarche.dev'
const OG_IMAGE = `${HOST}/og.svg`

const escapeHtml = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

const escapeAttr = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c],
  )

function buildHeadMeta(head) {
  return [
    `<meta property="og:type" content="${escapeAttr(head.ogType)}" />`,
    `<meta property="og:title" content="${escapeAttr(head.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(head.description)}" />`,
    `<meta property="og:url" content="${escapeAttr(head.canonical)}" />`,
    `<meta property="og:image" content="${escapeAttr(OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${escapeAttr(OG_IMAGE)}" />`,
    `<link rel="canonical" href="${escapeAttr(head.canonical)}" />`,
  ].join('\n    ')
}

// ── 4. emit one HTML per route ────────────────────────────────
const paths = allRoutePaths()
let count = 0
let totalBytes = 0

for (const pathname of paths) {
  const { html, head } = await render(pathname)

  let output = templateWithInlineCss
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(head.title)}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*\/?>/,
      `<meta name="description" content="${escapeAttr(head.description)}" />`,
    )

  output = output.replace(
    '</head>',
    `    ${buildHeadMeta(head)}\n  </head>`,
  )

  output = output.replace(
    '<div id="root"></div>',
    `<div id="root">${html}</div>`,
  )

  const outPath =
    pathname === '/'
      ? join(distClient, 'index.html')
      : join(distClient, pathname.replace(/^\//, ''), 'index.html')

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, output, 'utf-8')

  count++
  totalBytes += Buffer.byteLength(output, 'utf-8')
  const rel = outPath.replace(root + '/', '')
  console.log(
    `  ${pathname.padEnd(28)} → ${rel}  (${(output.length / 1024).toFixed(1)} KB)`,
  )
}

console.log(
  `prerendered ${count} routes, ${(totalBytes / 1024).toFixed(1)} KB total`,
)

// ── 5. sitemap.xml (canonical routes only) ────────────────────
const now = new Date().toISOString().split('T')[0]
const canonical = canonicalRoutePaths()
const sitemapUrls = canonical
  .map((p) => {
    const loc = escapeAttr(`${HOST}${p}`)
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`
  })
  .join('\n')

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  sitemapUrls,
  '</urlset>',
].join('\n')

writeFileSync(join(distClient, 'sitemap.xml'), sitemap, 'utf-8')
console.log(`  sitemap.xml → ${canonical.length} canonical URLs`)

// ── 6. robots.txt ─────────────────────────────────────────────
const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${HOST}/sitemap.xml`,
].join('\n')

writeFileSync(join(distClient, 'robots.txt'), robots, 'utf-8')
console.log('  robots.txt')
