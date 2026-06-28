import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const iconDir = join(root, 'src-tauri', 'icons')
mkdirSync(iconDir, { recursive: true })

const svg = readFileSync(join(root, 'public', 'favicon.svg'), 'utf8')

const sizes = [32, 128, 256, 512, 1024]

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  })
  const png = resvg.render().asPng()
  const name =
    size === 1024
      ? 'icon.png'
      : size === 256
        ? '128x128@2x.png'
        : `${size}x${size}.png`
  writeFileSync(join(iconDir, name), png)
  console.log(`  ${name} (${size}x${size})`)
}

// Generate .icns using the iconutil approach:
// Create an .iconset directory, populate it, then run iconutil
import { execSync } from 'node:child_process'

const iconsetDir = join(iconDir, 'blutils.iconset')
mkdirSync(iconsetDir, { recursive: true })

const iconsetSizes = [
  { name: 'icon_16x16.png', size: 16 },
  { name: 'icon_16x16@2x.png', size: 32 },
  { name: 'icon_32x32.png', size: 32 },
  { name: 'icon_32x32@2x.png', size: 64 },
  { name: 'icon_128x128.png', size: 128 },
  { name: 'icon_128x128@2x.png', size: 256 },
  { name: 'icon_256x256.png', size: 256 },
  { name: 'icon_256x256@2x.png', size: 512 },
  { name: 'icon_512x512.png', size: 512 },
  { name: 'icon_512x512@2x.png', size: 1024 },
]

for (const { name, size } of iconsetSizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  })
  const png = resvg.render().asPng()
  writeFileSync(join(iconsetDir, name), png)
}

execSync(`iconutil -c icns -o "${join(iconDir, 'icon.icns')}" "${iconsetDir}"`)
execSync(`rm -rf "${iconsetDir}"`)
console.log('  icon.icns')
console.log('Done.')
