import { describe, expect, it } from 'vitest'
import {
  buildAlphabet,
  entropyBits,
  randomString,
  randomStrings,
  toAlphabet,
} from './engine'

/** Deterministic uint32 source from a fixed list; throws if drained. */
function seq(values: number[]): () => number {
  let i = 0
  return () => {
    if (i >= values.length) throw new Error('seq exhausted')
    return values[i++]!
  }
}

describe('toAlphabet', () => {
  it('dedupes while preserving order', () => {
    expect(toAlphabet('aabbc')).toEqual(['a', 'b', 'c'])
  })

  it('keeps multi-byte code points intact', () => {
    expect(toAlphabet('😀😀x')).toEqual(['😀', 'x'])
  })
})

describe('buildAlphabet', () => {
  it('concatenates toggled sets', () => {
    const a = buildAlphabet({ sets: ['digits'], excludeAmbiguous: false })
    expect(a.join('')).toBe('0123456789')
  })

  it('removes exactly the ambiguous characters', () => {
    const a = buildAlphabet({
      sets: ['lowercase', 'uppercase', 'digits'],
      excludeAmbiguous: true,
    })
    for (const c of ['0', 'O', 'o', '1', 'l', 'I']) {
      expect(a).not.toContain(c)
    }
    expect(a).toContain('a')
    expect(a).toContain('9') // a non-ambiguous digit survives
  })
})

describe('randomString — rejection sampling', () => {
  it('maps a representable value with plain modulo', () => {
    // n=3, 7 % 3 = 1 -> index 1
    expect(randomString(1, ['a', 'b', 'c'], seq([7]))).toBe('b')
  })

  it('rejects the non-uniform tail and redraws', () => {
    // n=3 -> limit = floor(2^32/3)*3 = 4294967295.
    // 4294967295 is >= limit, so it must be rejected; then 5 % 3 = 2.
    expect(randomString(1, ['a', 'b', 'c'], seq([4294967295, 5]))).toBe('c')
  })

  it('throws on an alphabet with fewer than 2 characters', () => {
    expect(() => randomString(1, ['a'], seq([0]))).toThrow()
  })
})

describe('randomStrings — shape', () => {
  it('produces count strings of the requested length', () => {
    // 2 strings × 3 chars = 6 draws; all small so none rejected.
    const out = randomStrings(2, 3, ['a', 'b', 'c', 'd'], seq([0, 1, 2, 3, 0, 1]))
    expect(out).toHaveLength(2)
    for (const s of out) expect([...s]).toHaveLength(3)
    expect(out).toEqual(['abc', 'dab'])
  })
})

describe('entropyBits', () => {
  it('is length × log2(alphabet size), floored', () => {
    // 16 chars over a 64-symbol alphabet = 96 bits.
    expect(entropyBits(16, 64)).toBe(96)
  })

  it('is 0 for a degenerate alphabet', () => {
    expect(entropyBits(10, 1)).toBe(0)
  })
})
