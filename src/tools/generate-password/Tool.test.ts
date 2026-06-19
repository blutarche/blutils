import { describe, expect, it } from 'vitest'
import {
  buildClasses,
  combineClasses,
  generatePassphrase,
  generatePassword,
  passphraseEntropyBits,
  passwordEntropyBits,
  passwordEntropyBitsWithClasses,
  strengthLabel,
  WORDLIST,
  type CharClass,
} from './engine'

/** Deterministic uint32 source from a fixed list; throws if drained. */
function seq(values: number[]): () => number {
  let i = 0
  return () => {
    if (i >= values.length) throw new Error('seq exhausted')
    return values[i++]!
  }
}

describe('buildClasses', () => {
  it('builds one class per toggled set', () => {
    const classes = buildClasses({
      sets: ['lowercase', 'digits'],
      excludeAmbiguous: false,
    })
    expect(classes.map((c) => c.key)).toEqual(['lowercase', 'digits'])
    expect(classes[1]!.chars.join('')).toBe('0123456789')
  })

  it('removes ambiguous chars and drops emptied classes', () => {
    const classes = buildClasses({
      sets: ['digits', 'uppercase'],
      excludeAmbiguous: true,
    })
    const digits = classes.find((c) => c.key === 'digits')!
    for (const c of ['0', '1']) expect(digits.chars).not.toContain(c)
    expect(digits.chars).toContain('9')
    const upper = classes.find((c) => c.key === 'uppercase')!
    expect(upper.chars).not.toContain('O')
    expect(upper.chars).not.toContain('I')
  })
})

describe('combineClasses', () => {
  it('dedupes the union of class alphabets', () => {
    const classes: CharClass[] = [
      { key: 'lowercase', chars: ['a', 'b'] },
      { key: 'digits', chars: ['b', 'c'] }, // 'b' overlaps
    ]
    expect(combineClasses(classes)).toEqual(['a', 'b', 'c'])
  })
})

describe('generatePassword — rejection sampling', () => {
  const abc: CharClass[] = [{ key: 'lowercase', chars: ['a', 'b', 'c'] }]

  it('maps a representable value with plain modulo', () => {
    // n=3, 7 % 3 = 1 -> index 1 -> 'b'
    const out = generatePassword(
      { length: 1, classes: abc, requireEachClass: false },
      seq([7]),
    )
    expect(out).toBe('b')
  })

  it('rejects the non-uniform tail and redraws', () => {
    // n=3 -> limit = floor(2^32/3)*3 = 4294967295.
    // 4294967295 >= limit so it is rejected; then 5 % 3 = 2 -> 'c'.
    const out = generatePassword(
      { length: 1, classes: abc, requireEachClass: false },
      seq([4294967295, 5]),
    )
    expect(out).toBe('c')
  })

  it('throws on a combined alphabet with fewer than 2 chars', () => {
    expect(() =>
      generatePassword(
        { length: 4, classes: [{ key: 'lowercase', chars: ['a'] }], requireEachClass: false },
        seq([0, 0, 0, 0]),
      ),
    ).toThrow()
  })
})

describe('generatePassword — length & charset', () => {
  it('produces the requested length using only alphabet chars', () => {
    const classes: CharClass[] = [{ key: 'lowercase', chars: ['a', 'b', 'c', 'd'] }]
    const out = generatePassword(
      { length: 5, classes, requireEachClass: false },
      seq([0, 1, 2, 3, 0]),
    )
    expect(out).toBe('abcda')
    expect([...out]).toHaveLength(5)
    for (const ch of out) expect(['a', 'b', 'c', 'd']).toContain(ch)
  })
})

describe('generatePassword — requireEachClass guarantee', () => {
  const classes: CharClass[] = [
    { key: 'lowercase', chars: ['a', 'b'] },
    { key: 'digits', chars: ['1', '2'] },
  ]

  it('rejects passwords missing a class and redraws (uniform over valid set)', () => {
    // Combined alphabet = [a,b,1,2] (size 4, indices a=0 b=1 1=2 2=3).
    // Attempt 1 draws six 0s -> "aaaaaa": no digit, so REJECTED.
    // Attempt 2 draws five 0s + a 2 -> "aaaaa1": has 'a' and '1' -> ACCEPTED.
    const next = seq([
      0, 0, 0, 0, 0, 0, // attempt 1 -> "aaaaaa" (rejected)
      0, 0, 0, 0, 0, 2, // attempt 2 -> "aaaaa1" (accepted)
    ])
    const out = generatePassword(
      { length: 6, classes, requireEachClass: true },
      next,
    )
    expect(out).toBe('aaaaa1')
    // The guarantee: a lowercase char and a digit are both present.
    expect(/[ab]/.test(out)).toBe(true)
    expect(/[12]/.test(out)).toBe(true)
  })

  it('skips the guarantee when length < class count (impossible)', () => {
    // length 1 cannot hold one of each of 2 classes; no extra draws.
    const out = generatePassword(
      { length: 1, classes, requireEachClass: true },
      seq([2]), // 2 % 4 = 2 -> combined[2] = '1'
    )
    expect(out).toBe('1')
  })
})

describe('generatePassphrase', () => {
  const list = ['alpha', 'bravo', 'charlie', 'delta'] as const

  it('respects word count and separator', () => {
    const out = generatePassphrase(
      { words: 3, wordlist: list, separator: '-', capitalize: false, appendDigit: false },
      seq([0, 1, 2]),
    )
    expect(out).toBe('alpha-bravo-charlie')
  })

  it('capitalizes each word and appends a random digit', () => {
    // words: index 3 -> 'delta', 0 -> 'alpha'; digit draw 7 % 10 = 7.
    const out = generatePassphrase(
      { words: 2, wordlist: list, separator: '_', capitalize: true, appendDigit: true },
      seq([3, 0, 7]),
    )
    expect(out).toBe('Delta_Alpha7')
  })

  it('throws on a wordlist with fewer than 2 words', () => {
    expect(() =>
      generatePassphrase(
        { words: 2, wordlist: ['solo'], separator: '-', capitalize: false, appendDigit: false },
        seq([0, 0]),
      ),
    ).toThrow()
  })

  it('ships a 256-word wordlist (8 bits/word)', () => {
    expect(WORDLIST).toHaveLength(256)
    expect(new Set(WORDLIST).size).toBe(256)
  })
})

describe('entropy math', () => {
  it('password = floor(length × log2(alphabet size))', () => {
    // 16 chars over 64 symbols = 96 bits.
    expect(passwordEntropyBits(16, 64)).toBe(96)
  })

  it('password is 0 for a degenerate alphabet', () => {
    expect(passwordEntropyBits(10, 1)).toBe(0)
  })

  it('with-classes entropy equals unconstrained for a single class', () => {
    const one = buildClasses({ sets: ['lowercase'], excludeAmbiguous: false })
    expect(passwordEntropyBitsWithClasses(8, one)).toBe(
      passwordEntropyBits(8, 26),
    )
  })

  it('with-classes entropy is strictly lower when classes are required', () => {
    // Short password, all four classes required: the constraint
    // excludes a real fraction of the space, so entropy must drop
    // below the naive length×log2(A) and stay positive.
    const all = buildClasses({
      sets: ['lowercase', 'uppercase', 'digits', 'symbols'],
      excludeAmbiguous: false,
    })
    const A = combineClasses(all).length
    const constrained = passwordEntropyBitsWithClasses(4, all)
    expect(constrained).toBeLessThan(passwordEntropyBits(4, A))
    expect(constrained).toBeGreaterThan(0)
  })

  it('passphrase = floor(words × log2(wordlistSize))', () => {
    // 6 words over a 256-word list = 6 × 8 = 48 bits.
    expect(
      passphraseEntropyBits({ words: 6, wordlistSize: 256, appendDigit: false }),
    ).toBe(48)
  })

  it('passphrase adds log2(10) bits for an appended digit', () => {
    // 48 + 3.32 -> floor = 51.
    expect(
      passphraseEntropyBits({ words: 6, wordlistSize: 256, appendDigit: true }),
    ).toBe(51)
  })
})

describe('strengthLabel', () => {
  it('maps bit ranges to coarse labels', () => {
    expect(strengthLabel(20)).toBe('very weak')
    expect(strengthLabel(30)).toBe('weak')
    expect(strengthLabel(48)).toBe('fair')
    expect(strengthLabel(96)).toBe('strong')
    expect(strengthLabel(200)).toBe('very strong')
  })
})
