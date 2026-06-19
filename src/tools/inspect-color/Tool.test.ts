import { describe, expect, it } from 'vitest'
import {
  hslToRgb,
  parseColor,
  rgbToHsl,
  toHex,
  toHslString,
  toRgbString,
} from './engine'

describe('parseColor — hex', () => {
  it('parses #rrggbb', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('expands 3-digit shorthand #abc', () => {
    expect(parseColor('#abc')).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc, a: 1 })
  })

  it('parses 8-digit alpha #ff000080 to a≈0.5', () => {
    const c = parseColor('#ff000080')
    expect(c.r).toBe(255)
    expect(c.g).toBe(0)
    expect(c.b).toBe(0)
    expect(c.a).toBeCloseTo(0.5, 2)
  })

  it('throws on unparseable input', () => {
    expect(() => parseColor('not-a-color')).toThrow()
    expect(() => parseColor('#zzz')).toThrow()
    expect(() => parseColor('')).toThrow()
  })
})

describe('parseColor — rgb / hsl notation', () => {
  it('parses rgb()', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('parses rgba() with alpha', () => {
    const c = parseColor('rgba(0, 128, 255, 0.5)')
    expect(c).toMatchObject({ r: 0, g: 128, b: 255 })
    expect(c.a).toBeCloseTo(0.5, 5)
  })

  it('parses hsl() back into rgb', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })
})

describe('rgb ↔ hsl', () => {
  it('#ff0000 → hsl(0, 100%, 50%)', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0, a: 1 })).toMatchObject({
      h: 0,
      s: 100,
      l: 50,
    })
  })

  it('#00ff00 → hsl(120, 100%, 50%)', () => {
    expect(rgbToHsl({ r: 0, g: 255, b: 0, a: 1 })).toMatchObject({
      h: 120,
      s: 100,
      l: 50,
    })
  })

  it('hsl(0, 0%, 50%) → #808080 (±1 rounding)', () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 50, a: 1 })
    expect(rgb.r).toBeGreaterThanOrEqual(127)
    expect(rgb.r).toBeLessThanOrEqual(128)
    expect(rgb.r).toBe(rgb.g)
    expect(rgb.g).toBe(rgb.b)
    // After our rounding, 50% lightness lands exactly on 128.
    expect(toHex(rgb)).toBe('#808080')
  })
})

describe('formatters', () => {
  it('toHex of red is #ff0000', () => {
    expect(toHex({ r: 255, g: 0, b: 0, a: 1 })).toBe('#ff0000')
  })

  it('toHex appends alpha when a < 1', () => {
    expect(toHex({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('#ff000080')
  })

  it('toRgbString switches to rgba() with alpha', () => {
    expect(toRgbString({ r: 255, g: 0, b: 0, a: 1 })).toBe('rgb(255, 0, 0)')
    expect(toRgbString({ r: 0, g: 0, b: 0, a: 0.5 })).toBe('rgba(0, 0, 0, 0.5)')
  })

  it('toHslString of red is hsl(0, 100%, 50%)', () => {
    expect(toHslString({ r: 255, g: 0, b: 0, a: 1 })).toBe('hsl(0, 100%, 50%)')
  })
})

describe('round-trips', () => {
  it('rgb → hex → rgb', () => {
    const rgb = { r: 18, g: 200, b: 73, a: 1 }
    expect(parseColor(toHex(rgb))).toEqual(rgb)
  })

  it('rgb → hsl → rgb is stable for saturated colors', () => {
    const rgb = { r: 255, g: 0, b: 0, a: 1 }
    expect(hslToRgb(rgbToHsl(rgb))).toEqual(rgb)
  })

  it('parses what toHslString produces', () => {
    const rgb = { r: 0, g: 255, b: 0, a: 1 }
    expect(parseColor(toHslString(rgb))).toEqual(rgb)
  })
})
