import { describe, expect, it } from 'vitest'
import { NIL_UUID, randomUuids, uuidV4 } from './engine'

const V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** A 16-byte buffer with every byte set to `v`. */
function bytes(v: number): Uint8Array {
  return new Uint8Array(16).fill(v)
}

describe('uuidV4 — grammar and fixed bits', () => {
  it('matches the canonical v4 pattern', () => {
    expect(uuidV4(bytes(0xab))).toMatch(V4_RE)
  })

  it('forces the version nibble to 4', () => {
    // byte 6 -> position 14 in the hyphenated string.
    const id = uuidV4(bytes(0xff))
    expect(id[14]).toBe('4')
  })

  it('forces the variant high bits to 10', () => {
    // byte 8 -> position 19; high two bits 10 means 8/9/a/b.
    const id = uuidV4(bytes(0xff))
    expect('89ab').toContain(id[19])
  })

  it('all-zero bytes yield nil with version/variant overlaid', () => {
    expect(uuidV4(bytes(0x00))).toBe('00000000-0000-4000-8000-000000000000')
  })

  it('does not mutate the caller buffer', () => {
    const src = bytes(0x00)
    uuidV4(src)
    expect([...src]).toEqual([...bytes(0x00)])
  })

  it('produces a deterministic string for known bytes', () => {
    const src = Uint8Array.from([
      0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb,
      0xcc, 0xdd, 0xee, 0xff,
    ])
    // byte 6 (0x66) -> 0x46; byte 8 (0x88) -> 0x88.
    expect(uuidV4(src)).toBe('00112233-4455-4677-8899-aabbccddeeff')
  })

  it('throws when given fewer than 16 bytes', () => {
    expect(() => uuidV4(new Uint8Array(15))).toThrow()
  })
})

describe('randomUuids — shape', () => {
  it('produces count UUIDs, all valid v4', () => {
    let n = 0
    const out = randomUuids(5, (a) => a.fill(n++))
    expect(out).toHaveLength(5)
    for (const id of out) expect(id).toMatch(V4_RE)
  })

  it('uses the injected fill source deterministically', () => {
    const out = randomUuids(2, (a) => a.fill(0x00))
    expect(out).toEqual([
      '00000000-0000-4000-8000-000000000000',
      '00000000-0000-4000-8000-000000000000',
    ])
  })

  it('draws fresh bytes per UUID', () => {
    let call = 0
    const out = randomUuids(2, (a) => {
      a.fill(call === 0 ? 0x00 : 0xff)
      call++
    })
    expect(out[0]).not.toBe(out[1])
  })
})

describe('NIL_UUID', () => {
  it('is the all-zero UUID', () => {
    expect(NIL_UUID).toBe('00000000-0000-0000-0000-000000000000')
  })
})
