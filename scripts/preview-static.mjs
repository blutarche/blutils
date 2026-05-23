/**
 * Local production preview server.
 *
 * Replaces `vite preview` for testing the built site, because
 * Vite's preview falls back to /index.html for any path that
 * doesn't end with a trailing slash — even when a nested
 * dist/<path>/index.html exists. That hides hydration drift
 * and misrepresents how Cloudflare Pages will serve the site.
 *
 * Resolution order, per-request (matches Cloudflare Pages):
 *   1. exact file at dist/<path>
 *   2. dist/<path>.html
 *   3. dist/<path>/index.html
 *   4. SPA fallback to dist/index.html  (mirrors public/_redirects)
 *
 * Plain Node http + fs — no dependency.
 *
 * Usage: `pnpm preview` (PORT env var overrides 4173).
 */

import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distRoot = resolve(__dirname, '..', 'dist')
const port = Number(process.env.PORT ?? 4173)

if (!existsSync(distRoot)) {
  console.error(`preview: ${distRoot} not found. run \`pnpm build\` first.`)
  process.exit(1)
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function safeJoin(root, urlPath) {
  // Reject any path that escapes the dist root.
  const resolved = resolve(root, '.' + urlPath)
  if (resolved !== root && !resolved.startsWith(root + '/')) {
    return null
  }
  return resolved
}

function resolveFile(urlPath) {
  // Strip a single trailing slash (except the root).
  const pathname =
    urlPath.length > 1 && urlPath.endsWith('/')
      ? urlPath.slice(0, -1)
      : urlPath

  const base = safeJoin(distRoot, pathname === '/' ? '' : pathname)
  if (!base) return null

  if (pathname === '/' || pathname === '') {
    return join(distRoot, 'index.html')
  }

  // 1. exact file
  if (isFile(base)) return base
  // 2. <path>.html
  if (isFile(base + '.html')) return base + '.html'
  // 3. <path>/index.html
  const indexed = join(base, 'index.html')
  if (isFile(indexed)) return indexed
  // 4. SPA fallback
  return join(distRoot, 'index.html')
}

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`)
    const file = resolveFile(url.pathname)
    if (!file) {
      res.writeHead(400, { 'content-type': 'text/plain' })
      res.end('Bad request')
      return
    }
    const ext = extname(file).toLowerCase()
    const type = MIME[ext] ?? 'application/octet-stream'
    const body = readFileSync(file)
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'no-cache',
    })
    res.end(body)
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' })
    res.end(`Internal error: ${err instanceof Error ? err.message : String(err)}`)
  }
})

server.listen(port, () => {
  console.log(`static preview: http://localhost:${port}/`)
  console.log(`  serving: ${distRoot}`)
})
