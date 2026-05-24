/**
 * Rasterizes `public/og.svg` to `public/og.png` (1200×630).
 *
 * Slack, X, Facebook, LinkedIn, and Discord all refuse SVG OG
 * images; the production meta tag therefore points at og.png.
 * The SVG remains the source of truth — edit it, then re-run
 * `pnpm og` and commit both files together.
 *
 * Implementation: @resvg/resvg-js 2.x takes font *files*, not
 * buffers, and doesn't understand WOFF2. We decompress each
 * subset .woff2 to a TTF in a tmp directory via `wawoff2` and
 * hand the paths to Resvg. The decompressed files are deleted
 * after the render so they don't leak onto disk.
 */

import { Resvg } from '@resvg/resvg-js'
import wawoff2 from 'wawoff2'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const publicDir = join(root, 'public')

const sourceFonts = [
  { name: 'jetbrains-mono.ttf', path: 'fonts/jetbrains-mono/JetBrainsMono-Variable.subset.woff2' },
  { name: 'space-grotesk.ttf',  path: 'fonts/space-grotesk/SpaceGrotesk-Variable.subset.woff2' },
  { name: 'archivo.ttf',        path: 'fonts/archivo/Archivo-Variable.subset.woff2' },
]

const tmpDir = mkdtempSync(join(tmpdir(), 'blutils-og-'))

try {
  const fontFiles = []
  for (const { name, path } of sourceFonts) {
    const woff2 = readFileSync(join(publicDir, path))
    const ttf = await wawoff2.decompress(woff2)
    const out = join(tmpDir, name)
    writeFileSync(out, Buffer.from(ttf))
    fontFiles.push(out)
  }

  const svg = readFileSync(join(publicDir, 'og.svg'), 'utf8')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    background: '#0F0F11',
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: 'JetBrains Mono',
    },
  })

  const png = resvg.render().asPng()
  writeFileSync(join(publicDir, 'og.png'), png)
  console.log(`og.png → ${(png.length / 1024).toFixed(1)} KB`)
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}
