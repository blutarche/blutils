import { describe, expect, it } from 'vitest'
import {
  decodeTime,
  encodeRandom,
  encodeTime,
  ENCODING,
  ulid,
  ulids,
} from './engine'

const ULID_RE = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/

/** The 10 sequential bytes used as a fixed randomness vector. */
const SEQ = Uint8Array.from([
  0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99,
])

describe('encodeTime', () => {
  it('encodes the canonical spec example timestamp', () => {
    // 1469918176385 is the ULID spec's worked example -> 01ARYZ6S41.
    expect(encodeTime(1469918176385)).toBe('01ARYZ6S41')
  })

  it('encodes zero as ten zero chars', () => {
    expect(encodeTime(0)).toBe('0000000000')
  })

  it('encodes the max 48-bit timestamp as all Z', () => {
    expect(encodeTime(281474976710655)).toBe('7ZZZZZZZZZ')
  })

  it('rejects a timestamp past 2^48 - 1', () => {
    expect(() => encodeTime(281474976710656)).toThrow()
  })
})

describe('decodeTime', () => {
  it('round-trips a timestamp through encode/decode', () => {
    expect(decodeTime(encodeTime(1469918176385))).toBe(1469918176385)
  })

  it('reads the time prefix out of a full 26-char ULID', () => {
    expect(decodeTime(ulid(1469918176385, SEQ))).toBe(1469918176385)
  })
})

describe('encodeRandom', () => {
  it('encodes ten bytes to sixteen Crockford chars', () => {
    expect(encodeRandom(SEQ)).toBe('008J4CT4ANK7F24S')
  })

  it('throws when given fewer than ten bytes', () => {
    expect(() => encodeRandom(new Uint8Array(9))).toThrow()
  })
})

describe('ulid', () => {
  it('produces the exact ULID for a fixed timestamp and bytes', () => {
    expect(ulid(1, SEQ)).toBe('0000000001008J4CT4ANK7F24S')
  })

  it('is always 26 chars', () => {
    expect(ulid(0, new Uint8Array(10))).toHaveLength(26)
    expect(ulid(281474976710655, SEQ)).toHaveLength(26)
  })

  it('uses only Crockford-alphabet characters', () => {
    const out = ulid(1469918176385, SEQ)
    expect(out).toMatch(ULID_RE)
    for (const ch of out) expect(ENCODING).toContain(ch)
  })

  it('sorts lexicographically by ascending timestamp', () => {
    const a = ulid(1000, new Uint8Array(10).fill(0xff))
    const b = ulid(2000, new Uint8Array(10).fill(0x00))
    const c = ulid(3000, SEQ)
    const sorted = [c, a, b].slice().sort()
    expect(sorted).toEqual([a, b, c])
    // Even with maximal randomness on the earlier one, time wins.
    expect(a < b).toBe(true)
  })
})

describe('ulids', () => {
  it('produces count ULIDs, all valid', () => {
    let n = 0
    const out = ulids(5, 42, (a) => a.fill(n++))
    expect(out).toHaveLength(5)
    for (const id of out) expect(id).toMatch(ULID_RE)
  })

  it('uses the injected fill source deterministically', () => {
    const out = ulids(2, 0, (a) => a.fill(0x00))
    expect(out).toEqual([
      '00000000000000000000000000',
      '00000000000000000000000000',
    ])
  })

  it('draws fresh bytes per ULID', () => {
    let call = 0
    const out = ulids(2, 1, (a) => {
      a.fill(call === 0 ? 0x00 : 0xff)
      call++
    })
    expect(out[0]).not.toBe(out[1])
  })
})

describe('decodeTime is case-insensitive, encodeRandom is strict', () => {
  it('decodes a lowercase time prefix (ULID is case-insensitive)', () => {
    const t = encodeTime(1700000000000)
    expect(decodeTime(t.toLowerCase())).toBe(1700000000000)
  })

  it('rejects a random buffer that is not exactly 10 bytes', () => {
    expect(() => encodeRandom(new Uint8Array(9))).toThrow()
    expect(() => encodeRandom(new Uint8Array(11))).toThrow()
  })
})
