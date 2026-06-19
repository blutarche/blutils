import { describe, expect, it } from 'vitest'
import { decode, encode } from './engine'
import { ops } from './ops'

describe('encode — component variant', () => {
  it('escapes spaces as %20 (not +)', () => {
    expect(encode('a b', 'component')).toBe('a%20b')
  })

  it('escapes the reserved set ?&=#', () => {
    expect(encode('?&=#', 'component')).toBe('%3F%26%3D%23')
  })

  it('escapes multi-byte unicode', () => {
    expect(encode('é', 'component')).toBe('%C3%A9')
    expect(encode('😀', 'component')).toBe('%F0%9F%98%80')
  })
})

describe('encode — uri variant', () => {
  it('escapes spaces but leaves reserved chars intact', () => {
    expect(encode('http://x.io/a b?q=1&r=2#h', 'uri')).toBe(
      'http://x.io/a%20b?q=1&r=2#h',
    )
  })

  it('differs from component on reserved chars', () => {
    expect(encode('?&=#', 'uri')).toBe('?&=#')
  })
})

describe('decode — success', () => {
  it('decodes a component payload', () => {
    expect(decode('a%20b', 'component')).toEqual({ ok: true, value: 'a b' })
  })

  it('decodes %20 as a space, never + as a space', () => {
    // Unlike form-encoding, percent decoders leave + literal.
    expect(decode('a+b', 'component')).toEqual({ ok: true, value: 'a+b' })
  })

  it('decodes a uri payload preserving reserved chars', () => {
    expect(decode('http://x.io/a%20b?q=1', 'uri')).toEqual({
      ok: true,
      value: 'http://x.io/a b?q=1',
    })
  })
})

describe('decode — malformed input', () => {
  it('returns an error result for a bare percent', () => {
    const r = decode('%', 'component')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/malformed/)
  })

  it('returns an error result for a truncated sequence', () => {
    const r = decode('%E0%A4%A', 'component')
    expect(r.ok).toBe(false)
  })

  it('returns an error result for a non-hex escape', () => {
    expect(decode('%ZZ', 'component').ok).toBe(false)
    expect(decode('%ZZ', 'uri').ok).toBe(false)
  })
})

describe('round-trip', () => {
  const cases = ['a b', '?&=#', 'café', '😀', 'name=Ada & x', 'http://x.io/p q']

  it('component encode → decode is identity', () => {
    for (const s of cases) {
      const enc = encode(s, 'component')
      expect(decode(enc, 'component')).toEqual({ ok: true, value: s })
    }
  })

  it('uri encode → decode is identity', () => {
    for (const s of cases) {
      const enc = encode(s, 'uri')
      expect(decode(enc, 'uri')).toEqual({ ok: true, value: s })
    }
  })
})

describe('ops', () => {
  it('exposes url.encode and url.decode', () => {
    expect(ops.map((o) => o.id)).toEqual(['url.encode', 'url.decode'])
  })

  it('encode op round-trips through decode op', async () => {
    const enc = ops.find((o) => o.id === 'url.encode')!
    const dec = ops.find((o) => o.id === 'url.decode')!
    const s = 'a b?c=1&é=😀'
    expect(await dec.fn(await enc.fn(s))).toBe(s)
  })

  it('encode op is idempotent under double-decode of single-encode', async () => {
    // Encoding once then decoding once returns the original; this
    // guards against accidental double-escaping in the op.
    const enc = ops.find((o) => o.id === 'url.encode')!
    const dec = ops.find((o) => o.id === 'url.decode')!
    expect(await dec.fn(await enc.fn('100%'))).toBe('100%')
  })

  it('decode op throws on malformed input', () => {
    const dec = ops.find((o) => o.id === 'url.decode')!
    expect(() => dec.fn('%')).toThrow()
  })
})
