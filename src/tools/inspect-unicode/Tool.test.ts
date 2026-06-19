import { describe, expect, it } from 'vitest'
import {
  codePointCount,
  codeUnitCount,
  inspect,
  toEsEscape,
  toHex,
  toHtmlEntity,
  toUtf8Bytes,
} from './engine'

describe('inspect — ASCII', () => {
  it('describes a single BMP character', () => {
    expect(inspect('A')).toHaveLength(1)
    expect(inspect('A')[0]!).toEqual({
      char: 'A',
      codePoint: 0x41,
      hex: 'U+0041',
      jsEscape: 'A',
      esEscape: '\\u{41}',
      htmlEntity: '&#65;',
      utf8Bytes: '41',
    })
  })
})

describe('inspect — astral (grinning face, U+1F600)', () => {
  const grin = inspect('\u{1F600}')[0]!

  it('treats the surrogate pair as one code point', () => {
    expect(inspect('\u{1F600}')).toHaveLength(1)
    expect(grin.codePoint).toBe(0x1f600)
  })

  it('renders hex, escapes, entity, and UTF-8 bytes', () => {
    expect(grin.hex).toBe('U+1F600')
    expect(grin.jsEscape).toBe('\u{1F600}')
    expect(grin.esEscape).toBe('\\u{1F600}')
    expect(grin.htmlEntity).toBe('&#128512;')
    expect(grin.utf8Bytes).toBe('F0 9F 98 80')
  })
})

describe('inspect — combining mark (decomposed e + U+0301)', () => {
  // Built from explicit escapes so the source-file byte encoding can't
  // silently normalise one form into the other.
  const decomposed = 'e\u{0301}'
  const precomposed = '\u{00E9}'

  it('splits the decomposed form into two code points', () => {
    const records = inspect(decomposed)
    expect(records).toHaveLength(2)
    expect(records[0]!).toMatchObject({
      codePoint: 0x65,
      hex: 'U+0065',
      utf8Bytes: '65',
    })
    expect(records[1]!).toMatchObject({
      codePoint: 0x301,
      hex: 'U+0301',
      esEscape: '\\u{301}',
      utf8Bytes: 'CC 81',
    })
  })

  it('keeps the precomposed form as a single code point', () => {
    const records = inspect(precomposed)
    expect(records).toHaveLength(1)
    expect(records[0]!).toMatchObject({
      codePoint: 0xe9,
      hex: 'U+00E9',
      utf8Bytes: 'C3 A9',
    })
  })
})

describe('inspect — empty input', () => {
  it('returns an empty array', () => {
    expect(inspect('')).toEqual([])
  })
})

describe('toHex / toEsEscape / toHtmlEntity / toUtf8Bytes', () => {
  it('pads hex to at least four digits and grows for astral', () => {
    expect(toHex(0x41)).toBe('U+0041')
    expect(toHex(0x1f600)).toBe('U+1F600')
  })

  it('formats ES code-point escapes without padding', () => {
    expect(toEsEscape(0x41)).toBe('\\u{41}')
    expect(toEsEscape(0x1f600)).toBe('\\u{1F600}')
  })

  it('formats decimal HTML entities', () => {
    expect(toHtmlEntity(65)).toBe('&#65;')
    expect(toHtmlEntity(0x1f600)).toBe('&#128512;')
  })

  it('renders UTF-8 bytes as spaced uppercase pairs', () => {
    expect(toUtf8Bytes('A')).toBe('41')
    expect(toUtf8Bytes('\u{00E9}')).toBe('C3 A9')
    expect(toUtf8Bytes('\u{1F600}')).toBe('F0 9F 98 80')
  })
})

describe('codePointCount / codeUnitCount', () => {
  const mixed = 'A\u{1F600}\u{00E9}'

  it('counts code points, not surrogate halves', () => {
    expect(codePointCount(mixed)).toBe(3)
  })

  it('counts UTF-16 code units (astral chars are two)', () => {
    // 'A' = 1, grinning face = 2, é = 1 -> 4 code units.
    expect(codeUnitCount(mixed)).toBe(4)
  })

  it('is 0 for empty input', () => {
    expect(codePointCount('')).toBe(0)
    expect(codeUnitCount('')).toBe(0)
  })
})
