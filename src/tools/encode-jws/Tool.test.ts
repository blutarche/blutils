import { describe, expect, it } from 'vitest'
import { base64urlEncode, base64urlEncodeString, signJwt } from './engine'

/** base64url → bytes, for verifying round-trips in tests. */
function base64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (b64.length % 4)) % 4
  const bin = Buffer.from(b64 + '='.repeat(pad), 'base64').toString('binary')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function decodeSegmentJson(seg: string): Record<string, unknown> {
  const text = new TextDecoder().decode(base64urlDecode(seg))
  return JSON.parse(text) as Record<string, unknown>
}

describe('base64urlEncode / base64urlEncodeString', () => {
  it('uses the URL-safe alphabet and drops padding', () => {
    // 0xfb 0xff -> standard base64 "+/8=" -> url-safe "-_8" (no pad).
    expect(base64urlEncode(new Uint8Array([0xfb, 0xff]))).toBe('-_8')
  })

  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255])
    expect(base64urlDecode(base64urlEncode(bytes))).toEqual(bytes)
  })

  it('round-trips a UTF-8 string', () => {
    const s = 'héllo · wörld 😀'
    expect(new TextDecoder().decode(base64urlDecode(base64urlEncodeString(s)))).toBe(s)
  })
})

describe('signJwt — well-known HS256 vector', () => {
  const SECRET = 'your-256-bit-secret'
  const PAYLOAD = { sub: '1234567890', name: 'John Doe', iat: 1516239022 }
  // The classic jwt.io token for this header/payload/secret. Our
  // canonical header key order is {"alg":"HS256","typ":"JWT"} (alg
  // first), which is jwt.io's own ordering, so we get jwt.io's exact
  // token — signature SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c.
  // (The XbPfbIHM… variant corresponds to the reversed {typ,alg}
  // ordering; we assert re-decode + verifiability below regardless.)
  const KNOWN_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  it('produces the canonical jwt.io token', async () => {
    const token = await signJwt({}, PAYLOAD, SECRET, 'HS256')
    expect(token).toBe(KNOWN_TOKEN)
  })

  it('re-decodes to the same header and payload', async () => {
    const token = await signJwt({}, PAYLOAD, SECRET, 'HS256')
    const [h, p] = token.split('.') as [string, string, string]
    expect(decodeSegmentJson(h)).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decodeSegmentJson(p)).toEqual(PAYLOAD)
  })

  it('is deterministic for the same inputs', async () => {
    const a = await signJwt({}, PAYLOAD, SECRET, 'HS256')
    const b = await signJwt({}, PAYLOAD, SECRET, 'HS256')
    expect(a).toBe(b)
  })

  it('verifies under the same secret via SubtleCrypto', async () => {
    const token = await signJwt({}, PAYLOAD, SECRET, 'HS256')
    const [h, p, sig] = token.split('.') as [string, string, string]
    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(new TextEncoder().encode(SECRET)),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      new Uint8Array(base64urlDecode(sig)),
      new Uint8Array(new TextEncoder().encode(`${h}.${p}`)),
    )
    expect(ok).toBe(true)
  })
})

describe('signJwt — algorithms and secrets', () => {
  const PAYLOAD = { sub: '1234567890', name: 'John Doe', iat: 1516239022 }

  it('a different secret yields a different signature', async () => {
    const a = await signJwt({}, PAYLOAD, 'secret-one', 'HS256')
    const b = await signJwt({}, PAYLOAD, 'secret-two', 'HS256')
    expect(a.split('.')[2]).not.toBe(b.split('.')[2])
  })

  it('sets the alg header per algorithm', async () => {
    for (const algo of ['HS256', 'HS384', 'HS512'] as const) {
      const token = await signJwt({}, PAYLOAD, 'k', algo)
      const header = decodeSegmentJson(token.split('.')[0]!)
      expect(header.alg).toBe(algo)
    }
  })

  it('overrides a conflicting alg in the supplied header', async () => {
    const token = await signJwt({ alg: 'none' }, PAYLOAD, 'k', 'HS512')
    expect(decodeSegmentJson(token.split('.')[0]!).alg).toBe('HS512')
  })
})
