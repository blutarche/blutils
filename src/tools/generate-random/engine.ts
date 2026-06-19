/**
 * generate.random — pure random-string engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * with an injected, deterministic uint32 source. The Tool wires
 * the real Web Crypto source (`cryptoU32Source`) at the edge.
 *
 * Uniformity matters: a naive `u32 % n` biases toward the low
 * indices whenever `n` doesn't divide 2³² evenly. We reject the
 * top, non-uniform slice and redraw instead (rejection sampling).
 */

export const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/|~',
} as const

export type CharsetKey = keyof typeof CHARSETS

/** Visually confusable characters removed by "exclude ambiguous". */
const AMBIGUOUS = new Set(['0', 'O', 'o', '1', 'l', 'I'])

const TWO_32 = 0x100000000

/**
 * Deduped array of code points from a string. Iterating a string
 * with `for..of` yields whole code points, so a stray emoji or
 * combining mark stays intact instead of being split into broken
 * surrogate halves the way index access would.
 */
export function toAlphabet(set: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const ch of set) {
    if (seen.has(ch)) continue
    seen.add(ch)
    out.push(ch)
  }
  return out
}

/**
 * Build the alphabet from toggled named charsets. Ambiguous
 * exclusion applies here (the toggle-built set); a custom alphabet
 * is taken verbatim by the caller via `toAlphabet` and is never
 * run through this function.
 */
export function buildAlphabet(opts: {
  sets: readonly CharsetKey[]
  excludeAmbiguous: boolean
}): string[] {
  let chars = ''
  for (const k of opts.sets) chars += CHARSETS[k]
  let alpha = toAlphabet(chars)
  if (opts.excludeAmbiguous) alpha = alpha.filter((c) => !AMBIGUOUS.has(c))
  return alpha
}

/**
 * Uniform index in [0, n) drawn from a uint32 source via
 * rejection sampling. `next` must return an unsigned 32-bit int.
 */
function uniformIndex(n: number, next: () => number): number {
  // Largest multiple of n that fits in 2³². Anything at or above
  // it falls in the non-uniform tail and is rejected.
  const limit = Math.floor(TWO_32 / n) * n
  let x = next()
  while (x >= limit) x = next()
  return x % n
}

/** Shannon entropy of one generated string, in bits. */
export function entropyBits(length: number, alphabetSize: number): number {
  if (alphabetSize < 2 || length < 1) return 0
  return Math.floor(length * Math.log2(alphabetSize))
}

export function randomString(
  length: number,
  alphabet: readonly string[],
  next: () => number,
): string {
  if (alphabet.length < 2) {
    throw new Error('alphabet must have at least 2 distinct characters')
  }
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[uniformIndex(alphabet.length, next)]
  }
  return out
}

export function randomStrings(
  count: number,
  length: number,
  alphabet: readonly string[],
  next: () => number,
): string[] {
  return Array.from({ length: count }, () =>
    randomString(length, alphabet, next),
  )
}

/**
 * A uint32 source backed by Web Crypto, buffered in quota-safe
 * chunks. `getRandomValues` throws `QuotaExceededError` past
 * 65 536 bytes, i.e. 16 384 uint32s, so we refill in chunks of
 * exactly that size rather than asking for `length * count` at
 * once. Injectable for tests.
 */
export function cryptoU32Source(
  fill: (a: Uint32Array) => void = (a) => crypto.getRandomValues(a),
): () => number {
  const CHUNK = 16384 // 16384 * 4 bytes = 65 536, the quota ceiling
  let buf = new Uint32Array(0)
  let i = 0
  return () => {
    if (i >= buf.length) {
      buf = new Uint32Array(CHUNK)
      fill(buf)
      i = 0
    }
    return buf[i++]!
  }
}
