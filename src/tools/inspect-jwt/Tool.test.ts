import { describe, expect, it } from 'vitest'
import { decodeJwt, interpretClaims } from './engine'

// The classic HS256 example token from jwt.io.
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

describe('decodeJwt', () => {
  it('decodes header and payload of a known HS256 token', () => {
    const d = decodeJwt(SAMPLE)
    expect(d.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(d.payload.sub).toBe('1234567890')
    expect(d.payload.name).toBe('John Doe')
    expect(d.payload.iat).toBe(1516239022)
  })

  it('returns the raw signature without verifying it', () => {
    const d = decodeJwt(SAMPLE)
    expect(d.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    expect(d.raw.signature).toBe(d.signature)
  })

  it('tolerates surrounding whitespace', () => {
    const d = decodeJwt(`  ${SAMPLE}\n`)
    expect(d.payload.sub).toBe('1234567890')
  })

  it('throws on a token with the wrong number of segments', () => {
    expect(() => decodeJwt('eyJhbGc.eyJzdWI')).toThrow(/3/)
  })

  it('throws on an empty token', () => {
    expect(() => decodeJwt('   ')).toThrow()
  })

  it('throws when a segment is not valid JSON', () => {
    // "not-json" base64url-decodes to bytes that aren't JSON.
    const bad = 'bm90LWpzb24.bm90LWpzb24.sig'
    expect(() => decodeJwt(bad)).toThrow(/JSON/)
  })

  it('decodes base64url segments that use - and _', () => {
    // Header {"alg":"HS256"} happens to contain no url-safe chars,
    // so build a payload whose base64url contains both - and _.
    // {"d":"ÿþý"} → bytes contain 0xff sequences that
    // base64-encode with + and /, hence base64url - and _.
    const header = b64url(JSON.stringify({ alg: 'none' }))
    const payload = b64url(JSON.stringify({ d: 'ÿþý>' }))
    expect(payload).toMatch(/[-_]/)
    const d = decodeJwt(`${header}.${payload}.`)
    expect(d.payload.d).toBe('ÿþý>')
  })

  it('accepts an empty signature segment (alg: none)', () => {
    const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    const payload = b64url(JSON.stringify({ sub: 'x' }))
    const d = decodeJwt(`${header}.${payload}.`)
    expect(d.signature).toBe('')
    expect(d.header.alg).toBe('none')
  })
})

describe('interpretClaims', () => {
  it('flags an exp in the past as expired given a reference time', () => {
    const claims = interpretClaims({ exp: 1000 }, 2_000_000)
    expect(claims).toHaveLength(1)
    expect(claims[0]!.name).toBe('exp')
    expect(claims[0]!.note).toBe('expired')
    expect(claims[0]!.iso).toBe('1970-01-01T00:16:40.000Z')
  })

  it('flags an exp in the future as valid', () => {
    const claims = interpretClaims({ exp: 5000 }, 1000) // now=1s, exp=5000s
    expect(claims[0]!.note).toBe('valid')
  })

  it('renders iat as issued with an ISO timestamp', () => {
    const claims = interpretClaims({ iat: 1516239022 }, 1516239022_000)
    expect(claims[0]!.name).toBe('iat')
    expect(claims[0]!.note).toBe('issued')
    expect(claims[0]!.iso).toBe('2018-01-18T01:30:22.000Z')
  })

  it('flags nbf in the future as not yet valid', () => {
    const claims = interpretClaims({ nbf: 5000 }, 1000)
    expect(claims[0]!.note).toBe('not yet valid')
  })

  it('skips absent and non-numeric claims', () => {
    expect(interpretClaims({ sub: 'x' }, 0)).toEqual([])
    expect(interpretClaims({ exp: 'soon' }, 0)).toEqual([])
  })

  it('returns claims in exp/iat/nbf order when all present', () => {
    const claims = interpretClaims({ nbf: 1, iat: 2, exp: 3 }, 0)
    expect(claims.map((c) => c.name)).toEqual(['exp', 'iat', 'nbf'])
  })
})

/** base64url-encode a UTF-8 string (test helper, mirrors the engine). */
function b64url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  const std =
    typeof btoa !== 'undefined' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64')
  return std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
