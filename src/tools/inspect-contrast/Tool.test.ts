import { describe, expect, it } from 'vitest'
import {
  composite,
  contrastRatio,
  effectiveContrast,
  parseColor,
  relativeLuminance,
  wcagAssess,
} from './engine'

const BLACK = { r: 0, g: 0, b: 0 }
const WHITE = { r: 255, g: 255, b: 255 }
const GRAY = { r: 0x77, g: 0x77, b: 0x77 }

describe('parseColor', () => {
  it('parses 6-digit hex with and without #', () => {
    expect(parseColor('#ff8800')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
    expect(parseColor('ff8800')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
  })

  it('expands 3-digit shorthand hex', () => {
    expect(parseColor('#f80')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
  })

  it('parses 8- and 4-digit hex, keeping alpha', () => {
    const c8 = parseColor('#ff880080')!
    expect({ r: c8.r, g: c8.g, b: c8.b }).toEqual({ r: 255, g: 136, b: 0 })
    expect(c8.a).toBeCloseTo(0.502, 2)
    const c4 = parseColor('#f80c')! // c = 0xcc = 204/255 = 0.8
    expect({ r: c4.r, g: c4.g, b: c4.b }).toEqual({ r: 255, g: 136, b: 0 })
    expect(c4.a).toBeCloseTo(0.8, 5)
  })

  it('parses rgb() and rgba() with alpha', () => {
    expect(parseColor('rgb(255, 136, 0)')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
    expect(parseColor('rgba(255 136 0 / 0.5)')).toEqual({
      r: 255,
      g: 136,
      b: 0,
      a: 0.5,
    })
  })

  it('parses percentage rgb() channels', () => {
    expect(parseColor('rgb(100%, 0%, 0%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('clamps out-of-range rgb() channels', () => {
    expect(parseColor('rgb(300, -20, 50)')).toEqual({ r: 255, g: 0, b: 50, a: 1 })
  })

  it('returns null for unrecognized or empty input', () => {
    expect(parseColor('')).toBeNull()
    expect(parseColor('not a color')).toBeNull()
    expect(parseColor('#12')).toBeNull()
    expect(parseColor('rgb(1, 2)')).toBeNull()
  })
})

describe('alpha compositing', () => {
  it('composites a translucent color over a backdrop', () => {
    // white @ 50% over black -> mid gray (128).
    expect(composite({ r: 255, g: 255, b: 255, a: 0.5 }, BLACK)).toEqual({
      r: 128,
      g: 128,
      b: 128,
      a: 1,
    })
  })

  it('effectiveContrast honors alpha (white@50% on black is ~5.3, not 21)', () => {
    const fg = { r: 255, g: 255, b: 255, a: 0.5 }
    const ratio = effectiveContrast(fg, BLACK)
    expect(ratio).toBeCloseTo(5.32, 1)
    expect(ratio).toBeLessThan(21)
  })

  it('matches contrastRatio when both colors are opaque', () => {
    expect(effectiveContrast(BLACK, WHITE)).toBeCloseTo(contrastRatio(BLACK, WHITE), 10)
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 10)
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10)
  })
})

describe('contrastRatio', () => {
  it('black vs white is 21', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 2)
  })

  it('white vs white is 1', () => {
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 10)
  })

  it('#777777 on white is ≈ 4.48', () => {
    const ratio = contrastRatio(GRAY, WHITE)
    expect(ratio).toBeCloseTo(4.478, 3)
    const a = wcagAssess(ratio)
    expect(a.normalAA).toBe(false) // 4.478 < 4.5
    expect(a.largeAA).toBe(true) // 4.478 >= 3
  })

  it('is symmetric in argument order', () => {
    expect(contrastRatio(GRAY, WHITE)).toBeCloseTo(contrastRatio(WHITE, GRAY), 10)
    expect(contrastRatio(BLACK, GRAY)).toBeCloseTo(contrastRatio(GRAY, BLACK), 10)
  })
})

describe('wcagAssess thresholds', () => {
  it('passes at exactly 4.5 (normalAA / largeAAA boundary)', () => {
    const a = wcagAssess(4.5)
    expect(a.normalAA).toBe(true)
    expect(a.largeAAA).toBe(true)
    expect(a.normalAAA).toBe(false)
  })

  it('fails normalAA just below 4.5', () => {
    expect(wcagAssess(4.49).normalAA).toBe(false)
  })

  it('passes normalAAA at exactly 7', () => {
    expect(wcagAssess(7).normalAAA).toBe(true)
    expect(wcagAssess(6.99).normalAAA).toBe(false)
  })

  it('passes largeAA at exactly 3', () => {
    expect(wcagAssess(3).largeAA).toBe(true)
    expect(wcagAssess(2.99).largeAA).toBe(false)
  })
})
