/**
 * Pure Caesar / ROT13 transform — dependency-free so it can be
 * unit-tested without a DOM and reused as a Chain Op.
 *
 * Only ASCII letters (A-Z, a-z) rotate; case is preserved and every
 * other code point (digits, punctuation, whitespace, emoji, CJK …)
 * passes through unchanged. The shift is normalised mod 26 so any
 * integer — negative or greater than 25 — behaves sensibly.
 */

const A = 65 // 'A'
const Z = 90 // 'Z'
const a = 97 // 'a'
const z = 122 // 'z'

/** Rotate ASCII letters in `text` by `shift`, preserving case. */
export function caesar(text: string, shift: number): string {
  if (!Number.isFinite(shift)) {
    throw new Error('shift must be a finite number')
  }
  // Normalise into [0, 26): JS '%' keeps the sign, so add 26 first.
  const n = ((Math.trunc(shift) % 26) + 26) % 26
  if (n === 0) return text

  let out = ''
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    if (c >= A && c <= Z) {
      out += String.fromCharCode(((c - A + n) % 26) + A)
    } else if (c >= a && c <= z) {
      out += String.fromCharCode(((c - a + n) % 26) + a)
    } else {
      out += text[i]
    }
  }
  return out
}

/** ROT13 — a Caesar shift of 13, which is its own inverse. */
export function rot13(text: string): string {
  return caesar(text, 13)
}
