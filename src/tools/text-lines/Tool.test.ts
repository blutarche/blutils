import { describe, expect, it } from 'vitest'
import {
  dedupe,
  lineCount,
  operations,
  removeBlankLines,
  reverseLines,
  sortAsc,
  sortDesc,
  trimLines,
} from './engine'

describe('newline handling', () => {
  it('normalises CRLF and CR to LF on output', () => {
    expect(sortAsc('b\r\na\rc')).toBe('a\nb\nc')
  })

  it('preserves a trailing newline as a trailing blank line', () => {
    // "a\nb\n" splits to ['a','b',''] -> sorted ['','a','b'] -> "\na\nb"
    expect(sortAsc('a\nb\n')).toBe('\na\nb')
  })
})

describe('sortAsc', () => {
  it('sorts lines ascending, case-sensitive by default', () => {
    // Capitals sort before lowercase under the variant collator.
    expect(sortAsc('banana\nApple\ncherry')).toBe('Apple\nbanana\ncherry')
  })

  it('keeps blank lines and sorts them to the front', () => {
    expect(sortAsc('b\n\na')).toBe('\na\nb')
  })

  it('case-insensitive ordering interleaves mixed case', () => {
    // Sensitive: 'Apple','apple','banana'. Insensitive groups by letter.
    expect(sortAsc('banana\napple\nApple', { caseInsensitive: true })).toBe(
      'apple\nApple\nbanana',
    )
  })

  it('case-sensitive vs insensitive differ on mixed case', () => {
    const input = 'b\nA\na\nB'
    // Variant collator orders lowercase ahead of its uppercase pair.
    expect(sortAsc(input)).toBe('a\nA\nb\nB')
    // Accent folding makes a/A and b/B equal keys; the sort is stable,
    // so equal keys keep their original input order (A before a, b before B).
    expect(sortAsc(input, { caseInsensitive: true })).toBe('A\na\nb\nB')
  })

  it('orders numbers naturally', () => {
    expect(sortAsc('item10\nitem2\nitem1')).toBe('item1\nitem2\nitem10')
  })
})

describe('sortDesc', () => {
  it('sorts lines descending', () => {
    expect(sortDesc('Apple\nbanana\ncherry')).toBe('cherry\nbanana\nApple')
  })
})

describe('dedupe', () => {
  it('keeps the first occurrence and preserves order (stable)', () => {
    expect(dedupe('b\na\nb\nc\na')).toBe('b\na\nc')
  })

  it('treats blank lines as duplicates too', () => {
    expect(dedupe('a\n\nb\n\n')).toBe('a\n\nb')
  })

  it('does not trim before comparing', () => {
    // "a" and " a" are distinct lines.
    expect(dedupe('a\n a\na')).toBe('a\n a')
  })
})

describe('reverseLines', () => {
  it('reverses line order', () => {
    expect(reverseLines('a\nb\nc')).toBe('c\nb\na')
  })

  it('moves a trailing blank line to the front', () => {
    expect(reverseLines('a\nb\n')).toBe('\nb\na')
  })
})

describe('trimLines', () => {
  it('trims leading and trailing whitespace per line', () => {
    expect(trimLines('  a \n\tb\t\n c ')).toBe('a\nb\nc')
  })

  it('turns whitespace-only lines into empty lines (does not remove them)', () => {
    expect(trimLines('a\n   \nb')).toBe('a\n\nb')
  })
})

describe('removeBlankLines', () => {
  it('drops empty and whitespace-only lines', () => {
    expect(removeBlankLines('a\n\n  \nb\n\t\nc')).toBe('a\nb\nc')
  })

  it('drops a trailing blank line from a trailing newline', () => {
    expect(removeBlankLines('a\nb\n')).toBe('a\nb')
  })
})

describe('lineCount', () => {
  it('counts lines across mixed endings', () => {
    expect(lineCount('a\nb\r\nc\rd')).toBe(4)
  })

  it('counts a trailing newline as an extra empty line', () => {
    expect(lineCount('a\nb\n')).toBe(3)
  })
})

describe('operations registry', () => {
  it('exposes every operation with a stable id and label', () => {
    const ids = operations.map((o) => o.id)
    expect(ids).toEqual([
      'sort-asc',
      'sort-desc',
      'dedupe',
      'reverse',
      'trim',
      'remove-blank',
    ])
    for (const op of operations) {
      expect(op.label.length).toBeGreaterThan(0)
      expect(typeof op.fn('b\na')).toBe('string')
    }
  })

  it('sort-asc entry honours the case-insensitive option', () => {
    const sort = operations.find((o) => o.id === 'sort-asc')!
    // a and A are equal keys; stable sort keeps A (input idx 1) before a (idx 2).
    expect(sort.fn('b\nA\na', { caseInsensitive: true })).toBe('A\na\nb')
  })
})
