import { describe, expect, it } from 'vitest'
import { identify } from './engine'

const names = (input: string) => identify(input).map((c) => c.name)

describe('identify — prefixed schemes', () => {
  it('flags a bcrypt $2b$ hash high-confidence', () => {
    const out = identify('$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW')
    expect(out).toHaveLength(1)
    expect(out[0]!.name).toBe('bcrypt')
    expect(out[0]!.confidence).toBe('high')
  })

  it('accepts the $2a$ and $2y$ bcrypt variants too', () => {
    expect(names('$2a$10$abcdefghijklmnopqrstuv')).toEqual(['bcrypt'])
    expect(names('$2y$10$abcdefghijklmnopqrstuv')).toEqual(['bcrypt'])
  })

  it('flags an Argon2id hash as Argon2', () => {
    const out = identify(
      '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG',
    )
    expect(out).toHaveLength(1)
    expect(out[0]!.name).toBe('Argon2')
    expect(out[0]!.confidence).toBe('high')
  })

  it('recognizes the crypt scheme prefixes', () => {
    expect(names('$6$rounds=5000$salt$hash')).toEqual(['SHA-512 crypt'])
    expect(names('$5$salt$hash')).toEqual(['SHA-256 crypt'])
    expect(names('$1$salt$hash')).toEqual(['MD5 crypt'])
  })
})

describe('identify — pure-hex by length', () => {
  it('includes MD5 for a 32-char hex digest', () => {
    expect(names('5d41402abc4b2a76b9719d911017c592')).toContain('MD5')
  })

  it('includes SHA-1 for a 40-char hex digest', () => {
    expect(names('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')).toContain('SHA-1')
  })

  it('includes SHA-256 for a 64-char hex digest', () => {
    expect(
      names('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
    ).toContain('SHA-256')
  })

  it('marks ambiguous hex lengths medium with an ambiguity note', () => {
    const out = identify('5d41402abc4b2a76b9719d911017c592')
    expect(out[0]!.confidence).toBe('medium')
    expect(out[0]!.note).toMatch(/ambiguous/)
  })
})

describe('identify — edge cases', () => {
  it('returns [] for empty input', () => {
    expect(identify('')).toEqual([])
    expect(identify('   ')).toEqual([])
  })

  it('returns a low-confidence unknown for a clearly-non-hash string', () => {
    const out = identify('hello world, not a hash!')
    expect(out).toHaveLength(1)
    expect(out[0]!.name).toBe('unknown')
    expect(out[0]!.confidence).toBe('low')
  })

  it('treats hex of an unrecognized length as unknown', () => {
    expect(names('abcdef')).toEqual(['unknown'])
  })
})

describe('prefix-only inputs are not sold as high confidence', () => {
  it('downgrades a bare $2b$ prefix without a full bcrypt body', () => {
    const out = identify('$2b$')
    expect(out[0]!.name).toBe('bcrypt')
    expect(out[0]!.confidence).toBe('medium')
  })

  it('downgrades $6$ followed by a non-hash body', () => {
    const out = identify('$6$not-a-real-hash')
    expect(out[0]!.name).toBe('SHA-512 crypt')
    expect(out[0]!.confidence).toBe('medium')
  })
})
