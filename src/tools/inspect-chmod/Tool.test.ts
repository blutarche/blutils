import { describe, expect, it } from 'vitest'
import {
  octalToSymbolic,
  parseOctal,
  parseSymbolic,
  symbolicToOctal,
  toOctal,
  toSymbolic,
} from './engine'

describe('octalToSymbolic', () => {
  it('maps known modes', () => {
    expect(octalToSymbolic('755')).toBe('rwxr-xr-x')
    expect(octalToSymbolic('644')).toBe('rw-r--r--')
    expect(octalToSymbolic('777')).toBe('rwxrwxrwx')
    expect(octalToSymbolic('000')).toBe('---------')
  })

  it('accepts a numeric mode', () => {
    expect(octalToSymbolic(644)).toBe('rw-r--r--')
  })
})

describe('symbolicToOctal', () => {
  it('maps known modes', () => {
    expect(symbolicToOctal('rwxr-xr-x')).toBe('755')
    expect(symbolicToOctal('rw-r--r--')).toBe('644')
    expect(symbolicToOctal('rwxrwxrwx')).toBe('777')
    expect(symbolicToOctal('---------')).toBe('000')
  })
})

describe('round-trips', () => {
  it('octal → symbolic → octal is stable', () => {
    for (const mode of ['755', '644', '777', '000', '750', '600', '751']) {
      expect(symbolicToOctal(octalToSymbolic(mode))).toBe(mode)
    }
  })

  it('symbolic → octal → symbolic is stable', () => {
    for (const sym of ['rwxr-xr-x', 'rw-r--r--', 'rwxrwxrwx', '---------']) {
      expect(octalToSymbolic(symbolicToOctal(sym))).toBe(sym)
    }
  })
})

describe('parseOctal — structured representation', () => {
  it('decomposes into owner/group/other classes', () => {
    expect(parseOctal('640')).toEqual({
      owner: { r: true, w: true, x: false },
      group: { r: true, w: false, x: false },
      other: { r: false, w: false, x: false },
    })
  })

  it('toOctal / toSymbolic read the structure back out', () => {
    const perms = parseOctal('755')
    expect(toOctal(perms)).toBe('755')
    expect(toSymbolic(perms)).toBe('rwxr-xr-x')
  })

  it('throws on a non-octal digit', () => {
    expect(() => parseOctal('8')).toThrow()
    expect(() => parseOctal('888')).toThrow()
  })

  it('throws on the wrong number of digits', () => {
    expect(() => parseOctal('12')).toThrow()
    expect(() => parseOctal('7555')).toThrow()
  })
})

describe('parseSymbolic — validation', () => {
  it('throws on the wrong length', () => {
    expect(() => parseSymbolic('rwxr-xr-')).toThrow() // 8 chars
    expect(() => parseSymbolic('rwxr-xr-xx')).toThrow() // 10 chars
  })

  it('throws on an out-of-place or unknown char', () => {
    expect(() => parseSymbolic('xwxr-xr-x')).toThrow() // x in the r slot
    expect(() => parseSymbolic('rwzr-xr-x')).toThrow() // z is not r/w/x/-
  })
})
