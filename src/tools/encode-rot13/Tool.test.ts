import { describe, expect, it } from 'vitest'
import { caesar, rot13 } from './engine'

describe('rot13', () => {
  it('rotates the canonical sample', () => {
    expect(rot13('Hello, World!')).toBe('Uryyb, Jbeyq!')
  })

  it('is self-inverse', () => {
    const sample = 'The quick brown fox jumps over the lazy dog. 123!'
    expect(rot13(rot13(sample))).toBe(sample)
  })

  it('equals a Caesar shift of 13', () => {
    expect(rot13('abc')).toBe(caesar('abc', 13))
  })
})

describe('caesar — shifting', () => {
  it('shifts lowercase by 3', () => {
    expect(caesar('abc', 3)).toBe('def')
  })

  it('wraps uppercase past Z', () => {
    expect(caesar('XYZ', 3)).toBe('ABC')
  })

  it('handles a negative shift', () => {
    expect(caesar('def', -3)).toBe('abc')
  })

  it('handles a shift greater than 25', () => {
    // 29 mod 26 = 3
    expect(caesar('abc', 29)).toBe('def')
  })
})

describe('caesar — identity shifts', () => {
  it('shift 0 is identity', () => {
    expect(caesar('Hello, World!', 0)).toBe('Hello, World!')
  })

  it('shift 26 is identity', () => {
    expect(caesar('Hello, World!', 26)).toBe('Hello, World!')
  })
})

describe('caesar — decode relationship', () => {
  it('caesar(text, 26 - shift) reverses caesar(text, shift)', () => {
    const shift = 7
    const enc = caesar('Attack at dawn', shift)
    expect(caesar(enc, 26 - shift)).toBe('Attack at dawn')
  })
})

describe('caesar — non-letters pass through', () => {
  it('leaves digits, punctuation, and spaces untouched', () => {
    expect(caesar('0123 !@#-_=', 5)).toBe('0123 !@#-_=')
  })

  it('preserves case while rotating', () => {
    expect(caesar('AbZz', 1)).toBe('BcAa')
  })

  it('leaves emoji and CJK untouched while rotating ASCII letters', () => {
    expect(caesar('ab😀漢cd', 1)).toBe('bc😀漢de')
  })

  it('throws on a non-finite shift', () => {
    expect(() => caesar('abc', NaN)).toThrow()
    expect(() => caesar('abc', Infinity)).toThrow()
  })
})
