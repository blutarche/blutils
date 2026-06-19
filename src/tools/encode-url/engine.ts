/**
 * encode.url — pure URL percent-encoding engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * without a DOM. Two variants mirror the two browser primitives:
 *
 *   - "component" → encodeURIComponent / decodeURIComponent. Escapes
 *     the reserved set (?&=#/ etc.) too, so the result is safe to
 *     drop into a single query-string value or path segment.
 *   - "uri" → encodeURI / decodeURI. Leaves the reserved set intact,
 *     so a whole URL stays a usable URL.
 *
 * Encoding never throws. Decoding can: a stray or truncated percent
 * sequence (e.g. "%E0%A4%A" or a bare "%") makes the browser throw
 * URIError. Rather than surface a raw throw to the UI, `decode`
 * returns a discriminated Result the Tool can render as an error
 * chip.
 */

export type Variant = 'component' | 'uri'

export type DecodeResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

export function encode(input: string, variant: Variant): string {
  return variant === 'component'
    ? encodeURIComponent(input)
    : encodeURI(input)
}

export function decode(input: string, variant: Variant): DecodeResult {
  try {
    const value =
      variant === 'component' ? decodeURIComponent(input) : decodeURI(input)
    return { ok: true, value }
  } catch (err) {
    // decodeURIComponent / decodeURI throw URIError on a malformed
    // percent sequence. Normalise to a short, user-facing message.
    const detail = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `malformed percent-encoding: ${detail}` }
  }
}
