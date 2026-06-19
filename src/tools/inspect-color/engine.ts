/**
 * inspect.color — pure color parsing and conversion engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * directly. Everything funnels through a canonical Rgba record
 * (r/g/b in 0-255, a in 0-1); parsers normalise into it and the
 * formatters/converters read out of it.
 *
 * The parser accepts hex (#rgb / #rrggbb / #rrggbbaa), rgb()/rgba(),
 * and hsl()/hsla() and throws on anything it can't make sense of so
 * the Tool can surface a clear error chip.
 */

export interface Rgba {
  /** 0-255 */
  r: number
  /** 0-255 */
  g: number
  /** 0-255 */
  b: number
  /** 0-1 */
  a: number
}

export interface Hsla {
  /** 0-360 */
  h: number
  /** 0-100 */
  s: number
  /** 0-100 */
  l: number
  /** 0-1 */
  a: number
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function round(n: number): number {
  return Math.round(n)
}

/** Parse a color string in any supported notation into canonical Rgba. */
export function parseColor(input: string): Rgba {
  const s = input.trim()
  if (s === '') throw new Error('empty color')
  if (s[0] === '#') return parseHex(s)
  const fn = s.toLowerCase()
  if (fn.startsWith('rgb')) return parseRgbFn(s)
  if (fn.startsWith('hsl')) return parseHslFn(s)
  throw new Error(`unrecognised color: ${input}`)
}

function parseHex(s: string): Rgba {
  const hex = s.slice(1)
  if (!/^[0-9a-fA-F]+$/.test(hex)) throw new Error(`bad hex: ${s}`)
  // #rgb / #rgba shorthand → expand each nibble.
  if (hex.length === 3 || hex.length === 4) {
    const r = expandNibble(hex[0]!)
    const g = expandNibble(hex[1]!)
    const b = expandNibble(hex[2]!)
    const a = hex.length === 4 ? expandNibble(hex[3]!) / 255 : 1
    return { r, g, b, a }
  }
  if (hex.length === 6 || hex.length === 8) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a }
  }
  throw new Error(`bad hex length: ${s}`)
}

function expandNibble(c: string): number {
  return parseInt(c + c, 16)
}

/** Split the argument list inside rgb(...) / hsl(...); tolerant of commas and slash-alpha. */
function fnArgs(s: string): string[] {
  const open = s.indexOf('(')
  const close = s.lastIndexOf(')')
  if (open < 0 || close < 0 || close < open) throw new Error(`malformed: ${s}`)
  const body = s.slice(open + 1, close)
  return body
    .split(/[\s,/]+/)
    .map((t) => t.trim())
    .filter((t) => t !== '')
}

/** A numeric token, optionally a percentage; scaled to `whole` (the 100% value). */
function num(token: string, whole: number): number {
  if (token.endsWith('%')) {
    const v = Number(token.slice(0, -1))
    if (!Number.isFinite(v)) throw new Error(`bad number: ${token}`)
    return (v / 100) * whole
  }
  const v = Number(token)
  if (!Number.isFinite(v)) throw new Error(`bad number: ${token}`)
  return v
}

/** Alpha can be a 0-1 float or a percentage. */
function alpha(token: string | undefined): number {
  if (token === undefined) return 1
  if (token.endsWith('%')) {
    const v = Number(token.slice(0, -1))
    if (!Number.isFinite(v)) throw new Error(`bad alpha: ${token}`)
    return clamp(v / 100, 0, 1)
  }
  const v = Number(token)
  if (!Number.isFinite(v)) throw new Error(`bad alpha: ${token}`)
  return clamp(v, 0, 1)
}

function parseRgbFn(s: string): Rgba {
  const args = fnArgs(s)
  if (args.length < 3) throw new Error(`rgb needs 3 channels: ${s}`)
  return {
    r: clamp(round(num(args[0]!, 255)), 0, 255),
    g: clamp(round(num(args[1]!, 255)), 0, 255),
    b: clamp(round(num(args[2]!, 255)), 0, 255),
    a: alpha(args[3]),
  }
}

function parseHslFn(s: string): Rgba {
  const args = fnArgs(s)
  if (args.length < 3) throw new Error(`hsl needs h, s, l: ${s}`)
  const h = ((Number(args[0]!.replace(/deg$/, '')) % 360) + 360) % 360
  if (!Number.isFinite(h)) throw new Error(`bad hue: ${s}`)
  const sPct = clamp(num(args[1]!, 100), 0, 100)
  const lPct = clamp(num(args[2]!, 100), 0, 100)
  const rgb = hslToRgb({ h, s: sPct, l: lPct, a: alpha(args[3]) })
  return rgb
}

/** rgb → hsl. Hue in 0-360, s/l in 0-100; alpha carried through. */
export function rgbToHsl({ r, g, b, a }: Rgba): Hsla {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
    }
    h *= 60
    if (h < 0) h += 360
  }

  return {
    h: round(h),
    s: round(s * 100),
    l: round(l * 100),
    a,
  }
}

/** hsl → rgb. Inverse of rgbToHsl; alpha carried through. */
export function hslToRgb({ h, s, l, a }: Hsla): Rgba {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = ln - c / 2
  return {
    r: clamp(round((r + m) * 255), 0, 255),
    g: clamp(round((g + m) * 255), 0, 255),
    b: clamp(round((b + m) * 255), 0, 255),
    a,
  }
}

function hex2(n: number): string {
  return clamp(round(n), 0, 255).toString(16).padStart(2, '0')
}

/** Canonical Rgba → #rrggbb, or #rrggbbaa when alpha < 1. */
export function toHex({ r, g, b, a }: Rgba): string {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`
  if (a >= 1) return base
  return base + hex2(a * 255)
}

/** Canonical Rgba → rgb(...) / rgba(...). */
export function toRgbString({ r, g, b, a }: Rgba): string {
  const rr = clamp(round(r), 0, 255)
  const gg = clamp(round(g), 0, 255)
  const bb = clamp(round(b), 0, 255)
  if (a >= 1) return `rgb(${rr}, ${gg}, ${bb})`
  return `rgba(${rr}, ${gg}, ${bb}, ${roundAlpha(a)})`
}

/** Canonical Rgba → hsl(...) / hsla(...). */
export function toHslString(rgba: Rgba): string {
  const { h, s, l, a } = rgbToHsl(rgba)
  if (a >= 1) return `hsl(${h}, ${s}%, ${l}%)`
  return `hsla(${h}, ${s}%, ${l}%, ${roundAlpha(a)})`
}

/** Trim alpha to at most 3 decimals without trailing-zero noise. */
function roundAlpha(a: number): number {
  return Math.round(a * 1000) / 1000
}
