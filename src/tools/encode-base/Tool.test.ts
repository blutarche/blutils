import { describe, expect, it } from 'vitest'
import {
  MAX_BASE,
  parseInBase,
  toBase,
  toBinary,
  toDecimal,
  toHex,
  toOctal,
} from './engine'
import { ops } from './ops'

describe('toBase — known vectors', () => {
  it('renders 255 across the common bases', () => {
    const v = 255n
    expect(toHex(v)).toBe('ff')
    expect(toBinary(v)).toBe('11111111')
    expect(toOctal(v)).toBe('377')
    expect(toDecimal(v)).toBe('255')
  })

  it('is lowercase for hex digits', () => {
    expect(toBase(2748n, 16)).toBe('abc') // 0xABC
  })

  it('renders 0 as "0" in every base', () => {
    expect(toBase(0n, 2)).toBe('0')
    expect(toBase(0n, 16)).toBe('0')
    expect(toBase(0n, 36)).toBe('0')
  })

  it('renders negatives with a leading minus', () => {
    expect(toHex(-255n)).toBe('-ff')
  })

  it('handles base 36', () => {
    expect(toBase(35n, 36)).toBe('z')
    expect(toBase(1295n, 36)).toBe('zz') // 35*36 + 35
  })
})

describe('parseInBase — known vectors', () => {
  it('parses 255 from each common base', () => {
    expect(parseInBase('ff', 16)).toBe(255n)
    expect(parseInBase('11111111', 2)).toBe(255n)
    expect(parseInBase('377', 8)).toBe(255n)
    expect(parseInBase('255', 10)).toBe(255n)
  })

  it('is case-insensitive', () => {
    expect(parseInBase('FF', 16)).toBe(255n)
    expect(parseInBase('Zz', 36)).toBe(1295n)
  })

  it('parses negatives', () => {
    expect(parseInBase('-ff', 16)).toBe(-255n)
    expect(parseInBase('-101', 2)).toBe(-5n)
  })

  it('tolerates underscore grouping between digits', () => {
    expect(parseInBase('1_000', 10)).toBe(1000n)
    expect(parseInBase('0xff_ff', 16)).toBe(65535n)
  })

  it('rejects misplaced underscores', () => {
    for (const bad of ['_', '1__2', '123_', '_12']) {
      expect(() => parseInBase(bad, 10)).toThrow(/underscore/)
    }
    expect(() => parseInBase('0x_ff', 'auto')).toThrow(/underscore/)
  })

  it('throws on a digit out of range for the base', () => {
    expect(() => parseInBase('2', 2)).toThrow(/invalid digit/)
    expect(() => parseInBase('1a', 10)).toThrow(/invalid digit/)
    expect(() => parseInBase('8', 8)).toThrow(/invalid digit/)
  })

  it('throws on empty input', () => {
    expect(() => parseInBase('', 10)).toThrow()
    expect(() => parseInBase('   ', 10)).toThrow()
  })

  it('throws on an out-of-range base', () => {
    expect(() => parseInBase('1', 1)).toThrow(/base must be/)
    expect(() => parseInBase('1', 37)).toThrow(/base must be/)
  })
})

describe('prefix parsing', () => {
  it('reads 0x / 0b / 0o in auto mode', () => {
    expect(parseInBase('0xff', 'auto')).toBe(255n)
    expect(parseInBase('0b1010', 'auto')).toBe(10n)
    expect(parseInBase('0o17', 'auto')).toBe(15n)
  })

  it('defaults to base 10 in auto mode with no prefix', () => {
    expect(parseInBase('255', 'auto')).toBe(255n)
  })

  it('accepts a prefix that agrees with the explicit base', () => {
    expect(parseInBase('0xff', 16)).toBe(255n)
    expect(parseInBase('0b1010', 2)).toBe(10n)
  })

  it('throws when a prefix conflicts with the explicit base', () => {
    expect(() => parseInBase('0xff', 10)).toThrow(/prefix implies base 16/)
  })
})

describe('arbitrary precision', () => {
  it('round-trips 2^100 without loss', () => {
    const big = 2n ** 100n
    const hex = toBase(big, 16)
    expect(parseInBase(hex, 16)).toBe(big)
    expect(toDecimal(big)).toBe('1267650600228229401496703205376')
  })

  it('round-trips a 100-digit decimal through hex', () => {
    const dec = '1'.repeat(100)
    const v = parseInBase(dec, 10)
    expect(toBase(parseInBase(toHex(v), 16), 10)).toBe(dec)
  })
})

describe('round-trips across all bases', () => {
  it('parse(toBase(v)) === v for every base 2..36', () => {
    const v = 123456789n
    for (let b = 2; b <= MAX_BASE; b++) {
      expect(parseInBase(toBase(v, b), b)).toBe(v)
    }
  })
})

describe('ops', () => {
  it('exposes base.dec2hex and base.hex2dec', () => {
    expect(ops.map((o) => o.id)).toEqual(['base.dec2hex', 'base.hex2dec'])
  })

  it('dec2hex and hex2dec are inverses', async () => {
    const dec2hex = ops.find((o) => o.id === 'base.dec2hex')!
    const hex2dec = ops.find((o) => o.id === 'base.hex2dec')!
    expect(await dec2hex.fn('255')).toBe('ff')
    expect(await hex2dec.fn('ff')).toBe('255')
    expect(await hex2dec.fn(await dec2hex.fn('4096'))).toBe('4096')
  })

  it('dec2hex throws on a non-decimal digit', () => {
    const dec2hex = ops.find((o) => o.id === 'base.dec2hex')!
    expect(() => dec2hex.fn('ff')).toThrow(/invalid digit/)
  })
})
