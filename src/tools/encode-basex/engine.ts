/**
 * encode.basex — pure Base32 / Base58 codecs over UTF-8 text.
 *
 * Dependency-free and DOM-free so the bit/byte logic can be unit
 * tested in isolation; Tool.tsx wires these to its UI at the edge.
 * UTF-8 is the canonical encoding both ways via TextEncoder /
 * TextDecoder, so emoji and CJK round-trip cleanly. Decoded bytes
 * pass through a fatal TextDecoder, so a payload that isn't valid
 * UTF-8 throws rather than yielding U+FFFD soup.
 *
 * Base32 follows RFC 4648 §6: the standard alphabet, 5-bit groups
 * packed MSB-first, '=' padding to an 8-character boundary.
 * Base58 follows the Bitcoin alphabet and the big-integer base
 * conversion that maps each leading 0x00 byte to a leading '1'.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/** Reverse lookup: char code → 5-bit value, -1 for unknown. */
const BASE32_LOOKUP = buildLookup(BASE32_ALPHABET)
/** Reverse lookup: char code → 0..57 value, -1 for unknown. */
const BASE58_LOOKUP = buildLookup(BASE58_ALPHABET)

function buildLookup(alphabet: string): Int8Array {
  const table = new Int8Array(128).fill(-1)
  for (let i = 0; i < alphabet.length; i++) {
    table[alphabet.charCodeAt(i)] = i
  }
  return table
}

// ── Base32 (RFC 4648 §6) ────────────────────────────────────────

/** UTF-8 encode `text`, then render its bytes as standard Base32. */
export function base32Encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  // Flush the trailing partial group, left-aligned in its 5 bits.
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  // Pad to a multiple of 8 characters.
  while (out.length % 8 !== 0) out += '='
  return out
}

/**
 * Decode standard Base32 back to UTF-8 text. Lowercase input is
 * accepted (uppercased first); whitespace and '=' padding are
 * ignored. Throws on any other non-alphabet character and on bytes
 * that aren't valid UTF-8.
 */
export function base32Decode(str: string): string {
  const cleaned = str.replace(/[\s=]+/g, '').toUpperCase()
  if (cleaned.length === 0) return ''
  // A base32 group is 8 chars = 5 bytes. Partial groups of 1, 3, or 6
  // chars can't represent a whole number of bytes — no canonical
  // encoder emits them — so reject rather than silently truncating.
  if ([1, 3, 6].includes(cleaned.length % 8)) {
    throw new Error('invalid base32 length')
  }
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i)
    const v = code < 128 ? (BASE32_LOOKUP[code] ?? -1) : -1
    if (v < 0) {
      throw new Error(`invalid base32 character: ${JSON.stringify(cleaned[i])}`)
    }
    value = (value << 5) | v
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  // Leftover bits past the last whole byte must be zero padding; a
  // non-zero remainder means the input encoded a fractional byte.
  if (bits > 0 && (value & ((1 << bits) - 1)) !== 0) {
    throw new Error('invalid base32 padding bits')
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes))
}

// ── Base58 (Bitcoin alphabet) ───────────────────────────────────

/** UTF-8 encode `text`, then render its bytes as Bitcoin Base58. */
export function base58Encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  // Each leading zero byte becomes a leading '1'.
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++

  // Big-integer base-256 → base-58 by repeated division, carried
  // through a little-endian digit array. Seeded empty so an
  // all-zero (or empty) input yields no base-58 digits — the value
  // is carried entirely by the leading '1's.
  const digits: number[] = []
  for (const b of bytes) {
    let carry = b
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i]! << 8
      digits[i] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }

  // Trim the high zero digit the array seeds with so the big-int
  // part of an all-zero-byte (or empty) input contributes nothing;
  // those bytes are already represented by the leading '1's.
  let len = digits.length
  while (len > 0 && digits[len - 1] === 0) len--

  let out = '1'.repeat(zeros)
  for (let i = len - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]!]
  return out
}

/**
 * Decode Bitcoin Base58 back to UTF-8 text. Leading '1's restore
 * the leading 0x00 bytes they encoded. Throws on any non-alphabet
 * character and on bytes that aren't valid UTF-8.
 */
export function base58Decode(str: string): string {
  if (str.length === 0) return ''
  let leadingOnes = 0
  while (leadingOnes < str.length && str[leadingOnes] === '1') leadingOnes++

  // Big-integer base-58 → base-256 over the digits past the leading
  // '1's, carried through a little-endian byte array. The leading
  // '1's are pure zero-padding and are restored separately, so
  // feeding them here would only grow a high zero byte to trim.
  const bytes: number[] = [0]
  for (let i = leadingOnes; i < str.length; i++) {
    const code = str.charCodeAt(i)
    const v = code < 128 ? (BASE58_LOOKUP[code] ?? -1) : -1
    if (v < 0) {
      throw new Error(`invalid base58 character: ${JSON.stringify(str[i])}`)
    }
    let carry = v
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j]! * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  // Drop the high zero byte the array carries when the value is 0
  // (i.e. input was only '1's), leaving an empty big-int part.
  let len = bytes.length
  while (len > 0 && bytes[len - 1] === 0) len--

  // bytes is little-endian; reverse and prepend the restored zeros.
  const out = new Uint8Array(leadingOnes + len)
  for (let i = 0; i < len; i++) {
    out[leadingOnes + i] = bytes[len - 1 - i]!
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(out)
}
