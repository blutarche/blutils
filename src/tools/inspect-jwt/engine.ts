/**
 * inspect.jwt — pure JWT (JWS compact serialization) decoder.
 *
 * Dependency-free and side-effect-free so it unit-tests cleanly.
 * This is a *decoder*, not a verifier: there is no secret or key
 * here (the app is local-only), so the signature is surfaced raw
 * and never checked. The Tool makes the "not verified" caveat
 * explicit in the UI.
 *
 * Standard claim interpretation (`exp` / `iat` / `nbf`, epoch
 * SECONDS per RFC 7519 §2) takes a reference epoch in milliseconds
 * as an argument rather than reading the clock, so the human notes
 * ("expired" / "valid") are deterministic under test.
 */

export interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  /** Raw, undecoded signature segment (base64url). May be empty. */
  signature: string
  /** The three original dot-delimited segments, verbatim. */
  raw: { header: string; payload: string; signature: string }
}

/**
 * base64url → bytes → UTF-8 string. Converts the URL-safe alphabet
 * (`-_`) back to standard (`+/`), re-pads to a multiple of 4, then
 * decodes. Throws on a malformed segment.
 */
function decodeSegment(segment: string): string {
  // Validate as base64url up front: only the URL-safe alphabet, and a
  // length of `% 4 === 1` can never be valid base64 (a lone trailing
  // sextet). This makes a malformed segment fail as base64url instead
  // of slipping through a permissive decoder (atob / Buffer) that may
  // return junk or empty bytes.
  if (!/^[A-Za-z0-9_-]*$/.test(segment) || segment.length % 4 === 1) {
    throw new Error('invalid base64url')
  }
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (b64.length % 4)) % 4
  const padded = b64 + '='.repeat(pad)
  let bin: string
  if (typeof atob !== 'undefined') {
    bin = atob(padded)
  } else {
    // Node / SSR fallback.
    bin = Buffer.from(padded, 'base64').toString('binary')
  }
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function parseJson(segment: string, which: 'header' | 'payload'): Record<string, unknown> {
  let json: string
  try {
    json = decodeSegment(segment)
  } catch {
    throw new Error(`Invalid base64url in ${which} segment`)
  }
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error(`${which} is not valid JSON`)
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${which} is not a JSON object`)
  }
  return value as Record<string, unknown>
}

/**
 * Decode a compact-serialized JWT. Requires exactly three
 * dot-delimited segments; the third (signature) may be empty
 * (`alg: none`). Does NOT verify the signature.
 */
export function decodeJwt(token: string): DecodedJwt {
  const t = token.trim()
  if (!t) throw new Error('Empty token')
  const parts = t.split('.')
  if (parts.length !== 3) {
    throw new Error(
      `Malformed token: expected 3 dot-separated segments, got ${parts.length}`,
    )
  }
  const [h, p, s] = parts as [string, string, string]
  if (!h || !p) {
    throw new Error('Malformed token: header and payload segments are required')
  }
  return {
    header: parseJson(h, 'header'),
    payload: parseJson(p, 'payload'),
    signature: s,
    raw: { header: h, payload: p, signature: s },
  }
}

export type ClaimName = 'exp' | 'iat' | 'nbf'

export interface ClaimInfo {
  name: ClaimName
  /** Epoch seconds as found in the payload. */
  seconds: number
  /** ISO-8601 rendering of that instant (UTC). */
  iso: string
  /** Human note relative to the reference time. */
  note: string
}

const CLAIM_NAMES: readonly ClaimName[] = ['exp', 'iat', 'nbf']

/**
 * Interpret the standard time claims (`exp` / `iat` / `nbf`) found
 * in a payload. `nowMs` is the reference instant (epoch ms) used to
 * decide the human note — passed in for testability. Claims that
 * are absent or non-numeric are skipped.
 */
export function interpretClaims(
  payload: Record<string, unknown>,
  nowMs: number,
): ClaimInfo[] {
  const out: ClaimInfo[] = []
  for (const name of CLAIM_NAMES) {
    const v = payload[name]
    if (typeof v !== 'number' || !Number.isFinite(v)) continue
    const ms = v * 1000
    const iso = new Date(ms).toISOString()
    let note: string
    if (name === 'exp') {
      note = nowMs >= ms ? 'expired' : 'valid'
    } else if (name === 'nbf') {
      note = nowMs >= ms ? 'active' : 'not yet valid'
    } else {
      note = 'issued'
    }
    out.push({ name, seconds: v, iso, note })
  }
  return out
}
