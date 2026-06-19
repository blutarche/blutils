/**
 * encode.html — pure HTML-entity encode / decode engine.
 *
 * Dependency-free and DOM-free so it can be unit-tested in node.
 * Decoding is done with an explicit named-entity table plus numeric
 * (`&#nnn;` / `&#xHH;`) handling rather than round-tripping through
 * innerHTML — the latter needs a document and would tie this module
 * to the browser.
 *
 * Encoding always escapes the five markup-significant characters
 * (`& < > " '`). The ampersand is escaped first so a literal `&`
 * never gets folded into an entity that a later pass would produce
 * (no double-encoding of `&amp;`). With `nonAscii`, every code point
 * above 0x7E becomes a decimal numeric entity; iteration is by code
 * point (`for..of`) so astral characters like emoji survive instead
 * of being split into broken surrogate halves.
 */

export interface EncodeOptions {
  /** Also convert chars > 0x7E to decimal numeric entities. */
  nonAscii?: boolean
}

/**
 * The five basics. `&` is listed first and applied first so an
 * inserted `&` from another replacement is never re-escaped.
 * Apostrophe uses the numeric `&#39;` — `&apos;` is not in the
 * HTML4 named set, so the numeric form is the safe choice.
 */
const BASIC_ESCAPES: ReadonlyArray<readonly [string, string]> = [
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&#39;'],
]

export function encode(text: string, opts: EncodeOptions = {}): string {
  let out = text
  // Escape `&` first, then the rest, so we never double-encode.
  for (const [ch, ent] of BASIC_ESCAPES) {
    out = out.split(ch).join(ent)
  }
  if (!opts.nonAscii) return out

  // Code-point-aware pass: anything above 0x7E becomes &#nnn;.
  let result = ''
  for (const ch of out) {
    const cp = ch.codePointAt(0)!
    result += cp > 0x7e ? `&#${cp};` : ch
  }
  return result
}

/**
 * Core named entities recognised on decode. Kept small and explicit
 * — the markup basics plus the common typographic / symbol set.
 */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  euro: '€',
  pound: '£',
  cent: '¢',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
}

// Matches a named entity, a decimal numeric entity, or a hex numeric
// entity. Unknown entities won't match and are left untouched.
const ENTITY_RE = /&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g

export function decode(text: string): string {
  return text.replace(ENTITY_RE, (match, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X'
      const cp = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      // Reject out-of-range code points; pass the raw text through.
      if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return match
      // NUL and lone surrogates aren't valid Unicode scalar values;
      // emitting them would corrupt the string. HTML maps these to the
      // replacement character.
      if (cp === 0 || (cp >= 0xd800 && cp <= 0xdfff)) return '�'
      try {
        return String.fromCodePoint(cp)
      } catch {
        return match
      }
    }
    const named = NAMED_ENTITIES[body]
    return named !== undefined ? named : match
  })
}
