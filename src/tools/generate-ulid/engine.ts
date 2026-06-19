/**
 * generate.ulid — pure ULID engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested with
 * an injected, deterministic byte source. The Tool supplies the real
 * timestamp (`Date.now()`) and the Web Crypto byte source at the edge.
 *
 * A ULID is 128 bits: a 48-bit millisecond Unix timestamp followed by
 * 80 bits of randomness, rendered as 26 characters of Crockford
 * base32. The timestamp encodes to 10 chars and the randomness to 16,
 * which makes ULIDs lexicographically sortable by creation time. The
 * timestamp is always passed in here; the engine never reads a clock.
 */

/**
 * Crockford base32 alphabet — the digits with I, L, O, and U removed
 * to avoid visual ambiguity (ULID spec). Index 0..31 maps to one char.
 */
export const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Reverse map from char to its 5-bit value, for decoding. */
const DECODE: Record<string, number> = {}
for (let i = 0; i < ENCODING.length; i++) DECODE[ENCODING[i]!] = i

/** Largest timestamp a 48-bit field can hold (2^48 - 1). */
const MAX_TIME = 281474976710655

/**
 * Encode a 48-bit millisecond timestamp as 10 Crockford base32 chars.
 * Filled most-significant-char first so the text sorts by time.
 */
export function encodeTime(ms: number): string {
  if (!Number.isInteger(ms) || ms < 0 || ms > MAX_TIME) {
    throw new Error('encodeTime requires an integer ms in [0, 2^48)')
  }
  let out = ''
  for (let i = 0; i < 10; i++) {
    out = ENCODING[ms % 32]! + out
    ms = Math.floor(ms / 32)
  }
  return out
}

/**
 * Decode a 10-char Crockford base32 time prefix back to milliseconds.
 * Used to prove a ULID's timestamp round-trips; tolerant of full
 * 26-char ULIDs (only the first 10 chars are read).
 */
export function decodeTime(ulidOrPrefix: string): number {
  const s = ulidOrPrefix.slice(0, 10)
  if (s.length < 10) throw new Error('decodeTime requires 10 time chars')
  let ms = 0
  for (const ch of s) {
    // ULID strings are case-insensitive per the spec; normalize up.
    const v = DECODE[ch.toUpperCase()]
    if (v === undefined) throw new Error(`invalid Crockford char: ${ch}`)
    ms = ms * 32 + v
  }
  return ms
}

/**
 * Encode 10 random bytes (80 bits) as 16 Crockford base32 chars. The
 * 80 bits are read big-endian and chopped into sixteen 5-bit groups.
 */
export function encodeRandom(bytes10: Uint8Array): string {
  // ULID randomness is exactly 80 bits; require exactly 10 bytes so a
  // wrong-sized buffer surfaces as an error instead of silently
  // dropping or zero-padding data.
  if (bytes10.length !== 10) {
    throw new Error('encodeRandom requires exactly 10 bytes')
  }
  const bits: number[] = []
  for (let i = 0; i < 10; i++) {
    const byte = bytes10[i]!
    for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1)
  }
  let out = ''
  for (let i = 0; i < 16; i++) {
    let v = 0
    for (let j = 0; j < 5; j++) v = (v << 1) | bits[i * 5 + j]!
    out += ENCODING[v]!
  }
  return out
}

/**
 * Build a 26-char ULID from a timestamp and 10 random bytes. The
 * timestamp is always supplied by the caller so the engine stays
 * clock-free and deterministic under test.
 */
export function ulid(ms: number, randomBytes: Uint8Array): string {
  return encodeTime(ms) + encodeRandom(randomBytes)
}

/**
 * Generate `count` ULIDs sharing the supplied timestamp, each drawing
 * its own fresh 10 random bytes. `fill` defaults to the Web Crypto
 * CSPRNG but is injectable for deterministic tests.
 */
export function ulids(
  count: number,
  ms: number,
  fill: (a: Uint8Array) => void = (a) => crypto.getRandomValues(a),
): string[] {
  return Array.from({ length: count }, () => {
    const bytes = new Uint8Array(10)
    fill(bytes)
    return ulid(ms, bytes)
  })
}
