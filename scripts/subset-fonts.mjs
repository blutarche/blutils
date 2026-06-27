/**
 * One-shot font subsetter.
 *
 * Downloads the upstream variable woff2 (Space Grotesk) and TTFs
 * (JetBrains Mono, Archivo) into fonts-source/ (gitignored), then
 * uses pyftsubset to emit Latin-only variable woff2s under
 * public/fonts/<family>/.
 *
 * Run via `pnpm subset:fonts`. Re-run when bumping an upstream
 * version; the committed outputs are the build inputs.
 *
 * Requires fontTools (pip install fonttools brotli zopfli).
 *
 * Unicode coverage: Basic Latin, Latin-1 Supplement, the OE
 * ligature, the general-punctuation block (en/em dash, curly
 * quotes, ellipsis, …), per mille, primes, the Euro sign, and the
 * TM glyph. Covers everything the design renders.
 */

import { mkdir, writeFile, access, stat } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const sourceDir = resolve(root, 'fonts-source')
const outputDir = resolve(root, 'public/fonts')

const UNICODE_RANGES = [
  'U+0000-00FF', // Basic Latin + Latin-1 Supplement
  'U+0152-0153', // OE ligature
  'U+2010-2027', // general punctuation (dashes, quotes, ellipsis)
  'U+2030',      // per mille
  'U+2032-2033', // primes
  'U+20AC',      // Euro sign
  'U+2122',      // trade mark
].join(',')

const FONTS = [
  {
    family: 'space-grotesk',
    source: {
      url: 'https://github.com/floriankarsten/space-grotesk/raw/master/fonts/woff2/SpaceGrotesk%5Bwght%5D.woff2',
      file: 'SpaceGrotesk[wght].woff2',
    },
    license: 'https://github.com/floriankarsten/space-grotesk/raw/master/OFL.txt',
    output: 'SpaceGrotesk-Variable.subset.woff2',
  },
  {
    family: 'jetbrains-mono',
    source: {
      url: 'https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono%5Bwght%5D.ttf',
      file: 'JetBrainsMono[wght].ttf',
    },
    license: 'https://github.com/JetBrains/JetBrainsMono/raw/master/OFL.txt',
    output: 'JetBrainsMono-Variable.subset.woff2',
  },
  {
    family: 'inter',
    source: {
      url: 'https://github.com/rsms/inter/raw/master/docs/font-files/InterVariable.woff2',
      file: 'InterVariable.woff2',
    },
    license: 'https://github.com/rsms/inter/raw/master/LICENSE.txt',
    output: 'Inter-Variable.subset.woff2',
  },
  {
    family: 'fjalla-one',
    source: {
      url: 'https://github.com/google/fonts/raw/main/ofl/fjallaone/FjallaOne-Regular.ttf',
      file: 'FjallaOne-Regular.ttf',
    },
    license: 'https://github.com/google/fonts/raw/main/ofl/fjallaone/OFL.txt',
    output: 'FjallaOne-Regular.subset.woff2',
  },
  {
    family: 'archivo',
    source: {
      url: 'https://github.com/Omnibus-Type/Archivo/raw/master/fonts/variable/Archivo%5Bwdth%2Cwght%5D.ttf',
      file: 'Archivo[wdth,wght].ttf',
    },
    license: 'https://github.com/Omnibus-Type/Archivo/raw/master/OFL.txt',
    output: 'Archivo-Variable.subset.woff2',
  },
]

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`fetch ${url} -> ${res.status}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
}

async function fileSize(path) {
  const s = await stat(path)
  return s.size
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

async function main() {
  await mkdir(sourceDir, { recursive: true })

  for (const font of FONTS) {
    const familyDir = resolve(outputDir, font.family)
    await mkdir(familyDir, { recursive: true })

    const sourcePath = resolve(sourceDir, font.source.file)
    if (!(await exists(sourcePath))) {
      process.stdout.write(`fetch ${font.family} source... `)
      await download(font.source.url, sourcePath)
      process.stdout.write(`${fmt(await fileSize(sourcePath))}\n`)
    }

    const licensePath = resolve(familyDir, 'OFL.txt')
    if (!(await exists(licensePath))) {
      process.stdout.write(`fetch ${font.family} OFL... `)
      await download(font.license, licensePath)
      process.stdout.write('ok\n')
    }

    const outputPath = resolve(familyDir, font.output)
    process.stdout.write(`subset ${font.family}... `)
    execSync(
      [
        'pyftsubset',
        JSON.stringify(sourcePath),
        `--output-file=${JSON.stringify(outputPath)}`,
        `--unicodes=${UNICODE_RANGES}`,
        '--layout-features=*',
        '--no-hinting',
        '--desubroutinize',
        '--flavor=woff2',
        '--with-zopfli',
      ].join(' '),
      { stdio: ['ignore', 'ignore', 'inherit'] },
    )
    process.stdout.write(`${fmt(await fileSize(outputPath))}\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
