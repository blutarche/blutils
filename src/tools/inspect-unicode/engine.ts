/**
 * inspect.unicode — pure per-code-point inspection engine.
 *
 * Dependency-free and DOM-free so the surrogate-handling logic can
 * be unit-tested in isolation; Tool.tsx wires these to its UI at the
 * edge. Iteration is by code point (for..of over the string), so an
 * astral character like 😀 (U+1F600) is treated as one record rather
 * than its two UTF-16 surrogate halves.
 *
 * UTF-8 bytes come from TextEncoder, which encodes whole code points,
 * so multi-byte sequences (é → C3 A9, 😀 → F0 9F 98 80) render
 * correctly. Counts distinguish code points (what a human reads) from
 * UTF-16 code units (what `string.length` returns) — the two diverge
 * exactly on astral characters.
 */

export interface CodePointInfo {
  /** The character itself (one code point, possibly a surrogate pair). */
  char: string
  /** Numeric code point, e.g. 0x1f600. */
  codePoint: number
  /** Canonical hex form, e.g. 'U+1F600' (min 4 digits, more for astral). */
  hex: string
  /** As a JS string literal would carry it: the raw char (e.g. 'A', '😀'). */
  jsEscape: string
  /** ECMAScript code-point escape, e.g. '\u{1F600}'. */
  esEscape: string
  /** Decimal HTML entity, e.g. '&#128512;'. */
  htmlEntity: string
  /** Space-separated UTF-8 byte pairs, e.g. 'F0 9F 98 80'. */
  utf8Bytes: string
}

const encoder = new TextEncoder()

/** 'U+' + zero-padded uppercase hex; at least 4 digits per convention. */
export function toHex(codePoint: number): string {
  return 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0')
}

/** ECMAScript code-point escape, e.g. '\\u{1F600}'. */
export function toEsEscape(codePoint: number): string {
  return '\\u{' + codePoint.toString(16).toUpperCase() + '}'
}

/** Decimal HTML numeric character reference, e.g. '&#128512;'. */
export function toHtmlEntity(codePoint: number): string {
  return '&#' + codePoint + ';'
}

/** Space-separated two-digit uppercase UTF-8 byte pairs for `char`. */
export function toUtf8Bytes(char: string): string {
  const bytes = encoder.encode(char)
  const pairs: string[] = []
  for (const b of bytes) {
    pairs.push(b.toString(16).toUpperCase().padStart(2, '0'))
  }
  return pairs.join(' ')
}

/**
 * Inspect `text` and return one record per Unicode code point, in
 * order. Iterating with for..of yields whole code points, so astral
 * characters stay intact. Returns an empty array for empty input.
 */
export function inspect(text: string): CodePointInfo[] {
  const out: CodePointInfo[] = []
  for (const char of text) {
    const codePoint = char.codePointAt(0)!
    // A lone surrogate (ill-formed UTF-16) has a code point but no
    // valid UTF-8 encoding — TextEncoder would emit the replacement
    // bytes, which would silently disagree with the U+D800-style hex.
    // Report it honestly instead.
    const loneSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff
    out.push({
      char,
      codePoint,
      hex: toHex(codePoint),
      jsEscape: char,
      esEscape: toEsEscape(codePoint),
      htmlEntity: toHtmlEntity(codePoint),
      utf8Bytes: loneSurrogate ? '— (lone surrogate)' : toUtf8Bytes(char),
    })
  }
  return out
}

/** Count of Unicode code points in `text` (astral chars count once). */
export function codePointCount(text: string): number {
  let n = 0
  for (const _ of text) n++
  return n
}

/** Count of UTF-16 code units in `text` (i.e. `text.length`). */
export function codeUnitCount(text: string): number {
  return text.length
}
