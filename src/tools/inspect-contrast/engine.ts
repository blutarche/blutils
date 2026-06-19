/**
 * inspect.contrast — pure WCAG contrast engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * against the published WCAG vectors. The Tool wires the two color
 * inputs at the edge.
 *
 * Self-contained hex + rgb() parser — deliberately does NOT import
 * from any other Tool folder. Accepts #rgb, #rgba, #rrggbb,
 * #rrggbbaa, and rgb()/rgba() forms. Alpha is *kept* (not ignored):
 * a translucent color is composited over its backdrop before the
 * ratio is computed, because contrast is a property of what the eye
 * actually sees, and silently dropping alpha gives dangerously wrong
 * results (e.g. white@50% on black is ~5.3:1, not 21:1).
 *
 * Luminance + ratio follow WCAG 2.x:
 *   sRGB linearization c/255, then c≤0.03928 ? c/12.92
 *     : ((c+0.055)/1.055)^2.4
 *   L = 0.2126 R + 0.7152 G + 0.0722 B
 *   ratio = (Llight + 0.05) / (Ldark + 0.05)
 */

export interface Rgb {
  r: number
  g: number
  b: number
  /** Alpha 0..1. Absent in old callers means opaque; default 1. */
  a?: number
}

/**
 * Parse a hex or rgb()/rgba() color string into 0..255 channels (plus
 * 0..1 alpha), or null when the input isn't a recognized color.
 * Channel values are clamped into range for the rgb() forms.
 */
export function parseColor(input: string): Rgb | null {
  const s = input.trim()
  if (s === '') return null

  const hex = parseHex(s)
  if (hex) return hex

  return parseRgb(s)
}

function parseHex(s: string): Rgb | null {
  const m = /^#?([0-9a-fA-F]+)$/.exec(s)
  if (!m) return null
  const h = m[1]!
  if (h.length === 3 || h.length === 4) {
    return {
      r: dup(h[0]!),
      g: dup(h[1]!),
      b: dup(h[2]!),
      a: h.length === 4 ? dup(h[3]!) / 255 : 1,
    }
  }
  if (h.length === 6 || h.length === 8) {
    return {
      r: byte(h.slice(0, 2)),
      g: byte(h.slice(2, 4)),
      b: byte(h.slice(4, 6)),
      a: h.length === 8 ? byte(h.slice(6, 8)) / 255 : 1,
    }
  }
  return null
}

/** Expand a single hex nibble to a byte, e.g. "f" → 255. */
function dup(c: string): number {
  return parseInt(c + c, 16)
}

function byte(pair: string): number {
  return parseInt(pair, 16)
}

function parseRgb(s: string): Rgb | null {
  const m = /^rgba?\(([^)]*)\)$/i.exec(s)
  if (!m) return null
  const parts = m[1]!.split(/[,/\s]+/).filter((p) => p !== '')
  if (parts.length < 3) return null
  const r = channel(parts[0]!)
  const g = channel(parts[1]!)
  const b = channel(parts[2]!)
  if (r === null || g === null || b === null) return null
  const a = parts[3] !== undefined ? alpha(parts[3]) : 1
  if (a === null) return null
  return { r, g, b, a }
}

/** Parse an alpha value — a 0..1 number or a percentage — clamped. */
function alpha(p: string): number | null {
  const pct = /^(-?\d*\.?\d+)%$/.exec(p)
  if (pct) {
    const v = Number(pct[1])
    return Number.isNaN(v) ? null : Math.max(0, Math.min(1, v / 100))
  }
  if (!/^-?\d*\.?\d+$/.test(p)) return null
  const v = Number(p)
  return Number.isNaN(v) ? null : Math.max(0, Math.min(1, v))
}

/** Parse one rgb() channel — number or percentage — clamped to 0..255. */
function channel(p: string): number | null {
  const pct = /^(-?\d*\.?\d+)%$/.exec(p)
  if (pct) {
    const v = Number(pct[1])
    if (Number.isNaN(v)) return null
    return clamp255((v / 100) * 255)
  }
  if (!/^-?\d*\.?\d+$/.test(p)) return null
  const v = Number(p)
  if (Number.isNaN(v)) return null
  return clamp255(v)
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

/** Relative luminance per WCAG 2.x (0..1). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const R = linearize(r)
  const G = linearize(g)
  const B = linearize(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function linearize(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/**
 * WCAG contrast ratio between two OPAQUE colors. Symmetric: the
 * lighter color is always the numerator, so argument order doesn't
 * matter. Range is 1 (identical) to 21 (black vs white). Any alpha on
 * the inputs is ignored here — use `effectiveContrast` for translucent
 * colors.
 */
export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

/** Opaque white — the assumed page backdrop behind a translucent bg. */
const PAGE: Rgb = { r: 255, g: 255, b: 255, a: 1 }

/** Alpha-composite `fg` over an (assumed-opaque) `bg`: the "over" op. */
export function composite(fg: Rgb, bg: Rgb): Rgb {
  const fa = fg.a ?? 1
  return {
    r: Math.round(fg.r * fa + bg.r * (1 - fa)),
    g: Math.round(fg.g * fa + bg.g * (1 - fa)),
    b: Math.round(fg.b * fa + bg.b * (1 - fa)),
    a: 1,
  }
}

/**
 * Contrast ratio honoring alpha. The background is first flattened
 * over the page (white), then the foreground is composited over that
 * flattened background — matching what the eye actually sees — before
 * the opaque ratio is taken. With both colors opaque this is exactly
 * `contrastRatio`.
 */
export function effectiveContrast(fg: Rgb, bg: Rgb, page: Rgb = PAGE): number {
  const bgOpaque = composite(bg, page)
  const fgOpaque = composite(fg, bgOpaque)
  return contrastRatio(fgOpaque, bgOpaque)
}

export interface WcagAssessment {
  /** Normal text (under ~18pt) AA — ratio ≥ 4.5. */
  normalAA: boolean
  /** Normal text AAA — ratio ≥ 7. */
  normalAAA: boolean
  /** Large text (≥18pt, or ≥14pt bold) AA — ratio ≥ 3. */
  largeAA: boolean
  /** Large text AAA — ratio ≥ 4.5. */
  largeAAA: boolean
}

export function wcagAssess(ratio: number): WcagAssessment {
  return {
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
  }
}
