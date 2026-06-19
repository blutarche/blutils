/**
 * generate.password — pure password / passphrase engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * with an injected, deterministic uint32 source. The Tool wires
 * the real Web Crypto source (`cryptoU32Source`) at the edge.
 *
 * Uniformity matters: a naive `u32 % n` biases toward the low
 * indices whenever `n` doesn't divide 2³² evenly. We reject the
 * top, non-uniform slice and redraw instead (rejection sampling) —
 * the same technique used by the generate.random engine.
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
 * Dedupe code points from a string, preserving order. Iterating
 * with `for..of` yields whole code points so a stray multi-byte
 * char stays intact instead of being split into surrogate halves.
 */
function dedupe(set: string): string[] {
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

// ── Password mode ────────────────────────────────────────────

/** One named-charset class as an ordered, deduped code-point list. */
export interface CharClass {
  key: CharsetKey
  chars: string[]
}

/**
 * Build the per-class alphabets from toggled named charsets.
 * Ambiguous exclusion applies here. Classes that end up empty
 * after exclusion are dropped. The combined alphabet is the union
 * across classes (deduped), which the caller can derive via
 * `combineClasses`.
 */
export function buildClasses(opts: {
  sets: readonly CharsetKey[]
  excludeAmbiguous: boolean
}): CharClass[] {
  const out: CharClass[] = []
  for (const key of opts.sets) {
    let chars = dedupe(CHARSETS[key])
    if (opts.excludeAmbiguous) chars = chars.filter((c) => !AMBIGUOUS.has(c))
    if (chars.length > 0) out.push({ key, chars })
  }
  return out
}

/** Deduped union of all class alphabets — the full password alphabet. */
export function combineClasses(classes: readonly CharClass[]): string[] {
  return dedupe(classes.map((c) => c.chars.join('')).join(''))
}

export interface PasswordOpts {
  length: number
  classes: readonly CharClass[]
  /** Guarantee at least one character from each class. */
  requireEachClass: boolean
}

/**
 * Generate a password. Each position is drawn uniformly from the
 * combined alphabet via rejection sampling (no modulo bias).
 *
 * When `requireEachClass` is set, we guarantee at least one char from
 * every class by *rejection at the whole-password level*: draw a
 * uniform password and accept it only if it already contains a
 * character from each class, otherwise redraw. This keeps the output
 * uniform over the valid set — every conforming password equally
 * likely — unlike a "force a few positions" overwrite, which skews the
 * distribution (and would make the reported entropy a lie). The
 * acceptance probability is high once `length >= classes.length`, so
 * redraws are few; `MAX_TRIES` guards a pathological alphabet. The
 * guarantee is skipped when `length < classes.length` (impossible),
 * which the UI surfaces to the user.
 *
 * Precondition: `classes` are mutually disjoint — which the only
 * caller, `buildClasses`, always produces (lower/upper/digits/symbols
 * never overlap). For disjoint classes `length >= classes.length` is
 * exactly the satisfiability condition. With overlapping classes one
 * char could satisfy several, so that guard would be too strict; this
 * function does not handle that case because it cannot arise here.
 */
export function generatePassword(
  opts: PasswordOpts,
  next: () => number,
): string {
  const alphabet = combineClasses(opts.classes)
  if (alphabet.length < 2) {
    throw new Error('alphabet must have at least 2 distinct characters')
  }
  const { length, classes } = opts

  const draw = (): string => {
    let out = ''
    for (let i = 0; i < length; i++) {
      out += alphabet[uniformIndex(alphabet.length, next)]!
    }
    return out
  }

  const mustCover =
    opts.requireEachClass && classes.length > 0 && length >= classes.length
  if (!mustCover) return draw()

  const classSets = classes.map((c) => new Set(c.chars))
  const MAX_TRIES = 10000
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const pw = draw()
    const chars = [...pw]
    if (classSets.every((set) => chars.some((ch) => set.has(ch)))) {
      return pw
    }
  }
  throw new Error('could not satisfy class requirements; increase length')
}

// ── Passphrase mode ──────────────────────────────────────────

/**
 * Self-contained wordlist for diceware-style passphrases. 256
 * short, common, unambiguous English words (3–6 letters). 256
 * words ⇒ exactly 8 bits of entropy per word, so a 6-word phrase
 * is 48 bits before any extra digit/casing. Kept short to stay
 * memorable and dependency-free.
 */
export const WORDLIST: readonly string[] = [
  'able', 'acid', 'acre', 'aged', 'also', 'arch', 'army', 'atom',
  'aunt', 'aura', 'away', 'axis', 'baby', 'back', 'bake', 'ball',
  'band', 'bank', 'barn', 'base', 'bath', 'beam', 'bean', 'bear',
  'beat', 'bell', 'belt', 'bend', 'best', 'bike', 'bird', 'bite',
  'blue', 'boat', 'body', 'bold', 'bone', 'book', 'boot', 'born',
  'boss', 'bowl', 'brag', 'bran', 'brew', 'brow', 'bulb', 'bull',
  'bush', 'busy', 'cafe', 'cake', 'calm', 'camp', 'cane', 'card',
  'care', 'cart', 'cash', 'cave', 'cell', 'chat', 'chef', 'chin',
  'chip', 'city', 'clam', 'claw', 'clay', 'clip', 'club', 'clue',
  'coal', 'coat', 'code', 'coin', 'cold', 'cook', 'cool', 'cope',
  'cord', 'core', 'corn', 'cost', 'crab', 'crew', 'crop', 'crow',
  'cube', 'curl', 'dart', 'dash', 'data', 'date', 'dawn', 'deal',
  'deck', 'deer', 'desk', 'dial', 'dice', 'dine', 'dirt', 'dish',
  'dock', 'doll', 'dome', 'door', 'dove', 'drag', 'draw', 'drum',
  'dual', 'duck', 'dune', 'dusk', 'dust', 'duty', 'each', 'earn',
  'east', 'easy', 'echo', 'edge', 'epic', 'face', 'fact', 'fade',
  'fair', 'fall', 'farm', 'fast', 'fear', 'feed', 'feet', 'fern',
  'film', 'find', 'fine', 'fire', 'firm', 'fish', 'fist', 'five',
  'flag', 'flat', 'flax', 'flee', 'flew', 'flip', 'flow', 'foam',
  'fold', 'fond', 'font', 'food', 'fork', 'form', 'fort', 'four',
  'free', 'frog', 'fuel', 'fund', 'gain', 'gala', 'game', 'gate',
  'gaze', 'gear', 'gift', 'glad', 'glow', 'glue', 'goal', 'goat',
  'gold', 'golf', 'gone', 'good', 'gown', 'grab', 'gray', 'grid',
  'grim', 'grin', 'grip', 'grow', 'gulf', 'hail', 'hair', 'half',
  'hall', 'halt', 'hand', 'hare', 'hawk', 'haze', 'heal', 'heap',
  'heat', 'herb', 'herd', 'hero', 'hike', 'hill', 'hint', 'hive',
  'hold', 'hole', 'home', 'hood', 'hook', 'hope', 'horn', 'host',
  'hour', 'hunt', 'hurt', 'idea', 'inch', 'iron', 'isle', 'jade',
  'jazz', 'join', 'joke', 'jump', 'jury', 'keen', 'keep', 'kelp',
  'kind', 'king', 'kiss', 'kite', 'knee', 'knot', 'lace', 'lake',
  'lamp', 'land', 'lane', 'lard', 'lava', 'lawn', 'leaf', 'leap',
  'lens', 'lime', 'line', 'link', 'lion', 'list', 'load', 'loaf',
]

export interface PassphraseOpts {
  words: number
  wordlist: readonly string[]
  separator: string
  capitalize: boolean
  /** Append a single random digit (0–9) to the whole phrase. */
  appendDigit: boolean
}

export function generatePassphrase(
  opts: PassphraseOpts,
  next: () => number,
): string {
  const { wordlist, words, separator } = opts
  if (wordlist.length < 2) {
    throw new Error('wordlist must have at least 2 words')
  }
  const picked: string[] = []
  for (let i = 0; i < words; i++) {
    let w = wordlist[uniformIndex(wordlist.length, next)]!
    if (opts.capitalize) w = w.charAt(0).toUpperCase() + w.slice(1)
    picked.push(w)
  }
  let out = picked.join(separator)
  if (opts.appendDigit) out += String(uniformIndex(10, next))
  return out
}

// ── Entropy ──────────────────────────────────────────────────

/** Password entropy in bits: floor(length × log2(alphabetSize)). */
export function passwordEntropyBits(
  length: number,
  alphabetSize: number,
): number {
  if (alphabetSize < 2 || length < 1) return 0
  return Math.floor(length * Math.log2(alphabetSize))
}

/**
 * Password entropy when "require each class" is enabled. The valid set
 * is smaller than alphabetSize^length (passwords missing a class are
 * excluded), so the naive formula overstates it. Compute the exact
 * probability that a uniform draw is valid via inclusion–exclusion
 * over which classes are absent, then
 *   bits = floor(length·log2(A) + log2(P_valid)).
 * Working in probability space (each term in [0,1]) sidesteps
 * BigInt-scale counts. Returns the unconstrained value for k = 0.
 */
export function passwordEntropyBitsWithClasses(
  length: number,
  classes: readonly CharClass[],
): number {
  const alphabet = combineClasses(classes)
  const A = alphabet.length
  if (A < 2 || length < 1) return 0
  const k = classes.length
  if (k === 0) return passwordEntropyBits(length, A)
  // The sum below is 2^k terms and `1 << k` is a 32-bit shift; the app
  // never exceeds 4 classes, so cap far below the shift limit and fall
  // back to the unconstrained estimate for any absurd class count.
  if (k > 20) return passwordEntropyBits(length, A)
  const classSets = classes.map((c) => new Set(c.chars))
  let pValid = 0
  for (let mask = 0; mask < 1 << k; mask++) {
    const excluded = new Set<string>()
    let bitsOn = 0
    for (let i = 0; i < k; i++) {
      if (mask & (1 << i)) {
        bitsOn++
        for (const ch of classSets[i]!) excluded.add(ch)
      }
    }
    const frac = (A - excluded.size) / A
    pValid += (bitsOn % 2 === 0 ? 1 : -1) * Math.pow(frac, length)
  }
  if (pValid <= 0) return 0
  return Math.floor(length * Math.log2(A) + Math.log2(pValid))
}

/**
 * Passphrase entropy in bits: floor(words × log2(wordlistSize)),
 * plus log2(10) ≈ 3.32 bits for an appended digit. Capitalizing
 * the first letter of every word is deterministic given the words,
 * so it adds no entropy and is not counted.
 */
export function passphraseEntropyBits(opts: {
  words: number
  wordlistSize: number
  appendDigit: boolean
}): number {
  if (opts.wordlistSize < 2 || opts.words < 1) return 0
  let bits = opts.words * Math.log2(opts.wordlistSize)
  if (opts.appendDigit) bits += Math.log2(10)
  return Math.floor(bits)
}

/** Coarse qualitative strength label from entropy bits. */
export function strengthLabel(bits: number): string {
  if (bits < 28) return 'very weak'
  if (bits < 36) return 'weak'
  if (bits < 60) return 'fair'
  if (bits < 128) return 'strong'
  return 'very strong'
}

/**
 * A uint32 source backed by Web Crypto, buffered in quota-safe
 * chunks. `getRandomValues` throws past 65 536 bytes (16 384
 * uint32s), so we refill in chunks of exactly that size rather
 * than asking for everything at once. Injectable for tests.
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
