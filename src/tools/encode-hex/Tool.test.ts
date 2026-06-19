import { describe, expect, it } from 'vitest'
import { hexToText, hexdump, textToHex } from './engine'

describe('textToHex', () => {
  it('encodes ASCII to lowercase pairs', () => {
    expect(textToHex('Hi')).toBe('4869')
  })

  it('encodes multi-byte UTF-8 (é, 😀)', () => {
    // é = U+00E9 -> C3 A9; 😀 = U+1F600 -> F0 9F 98 80
    expect(textToHex('é')).toBe('c3a9')
    expect(textToHex('😀')).toBe('f09f9880')
  })

  it('honors the uppercase option', () => {
    expect(textToHex('é', { upper: true })).toBe('C3A9')
  })

  it('honors a delimiter between byte pairs', () => {
    expect(textToHex('Hi', { delimiter: ' ' })).toBe('48 69')
    expect(textToHex('😀', { delimiter: ' ', upper: true })).toBe(
      'F0 9F 98 80',
    )
  })

  it('renders empty input as an empty string', () => {
    expect(textToHex('')).toBe('')
  })
})

describe('hexToText', () => {
  it('decodes lowercase and uppercase pairs', () => {
    expect(hexToText('4869')).toBe('Hi')
    expect(hexToText('C3A9')).toBe('é')
  })

  it('tolerates surrounding and interleaved whitespace', () => {
    expect(hexToText('  48 69 \n')).toBe('Hi')
    expect(hexToText('f0 9f 98 80')).toBe('😀')
  })

  it('throws on odd-length input', () => {
    expect(() => hexToText('486')).toThrow()
  })

  it('throws on a non-hex character', () => {
    expect(() => hexToText('48zz')).toThrow()
  })

  it('throws on bytes that are not valid UTF-8', () => {
    // 0xC3 starts a 2-byte sequence; 0x28 is not a valid continuation.
    expect(() => hexToText('c328')).toThrow()
  })

  it('decodes empty / whitespace-only input to an empty string', () => {
    expect(hexToText('')).toBe('')
    expect(hexToText('   ')).toBe('')
  })
})

describe('round-trip', () => {
  it('survives text → hex → text including unicode', () => {
    for (const s of ['Hi', 'é', '😀', 'mixed café 日本語 😀']) {
      expect(hexToText(textToHex(s))).toBe(s)
    }
  })

  it('survives across uppercase and delimiter options', () => {
    const s = 'café 😀'
    expect(hexToText(textToHex(s, { upper: true, delimiter: ' ' }))).toBe(s)
  })
})

describe('hexdump', () => {
  it('lays out offset, byte cells, and ascii gutter', () => {
    // "Hi\tthere" -> H i \t t h e r e ; the tab (0x09) is non-printable.
    const dump = hexdump('Hi\tthere')
    expect(dump).toBe(
      '00000000  48 69 09 74 68 65 72 65                          |Hi.there|',
    )
  })

  it('shows control bytes as dots in the gutter', () => {
    // 0x00 NUL and 0x1f are both non-printable -> '.'.
    const dump = hexdump('a\x00b\x1fc')
    expect(dump.endsWith('|a.b.c|')).toBe(true)
    expect(dump.startsWith('00000000  61 00 62 1f 63')).toBe(true)
  })

  it('wraps at 16 bytes per row with incrementing offsets', () => {
    const rows = hexdump('0123456789abcdefXY').split('\n')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.startsWith('00000000  ')).toBe(true)
    expect(rows[1]!.startsWith('00000010  ')).toBe(true)
    expect(rows[1]!.endsWith('|XY|')).toBe(true)
  })

  it('returns an empty string for empty input', () => {
    expect(hexdump('')).toBe('')
  })
})
