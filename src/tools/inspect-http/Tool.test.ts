import { describe, expect, it } from 'vitest'
import { classOf, lookup, search, STATUS_CODES } from './engine'

describe('lookup', () => {
  it('resolves common codes to their reason phrase', () => {
    expect(lookup(200)?.message).toBe('OK')
    expect(lookup(404)?.message).toBe('Not Found')
    expect(lookup(500)?.message).toBe('Internal Server Error')
  })

  it('returns the teapot for 418', () => {
    expect(lookup(418)?.message).toBe("I'm a teapot")
  })

  it('is undefined for an unregistered code', () => {
    expect(lookup(999)).toBeUndefined()
  })
})

describe('classOf', () => {
  it('labels each class by leading digit', () => {
    expect(classOf(100)).toBe('Informational')
    expect(classOf(204)).toBe('Success')
    expect(classOf(301)).toBe('Redirection')
    expect(classOf(404)).toBe('Client Error')
    expect(classOf(503)).toBe('Server Error')
  })

  it('is undefined outside the 1xx–5xx range', () => {
    expect(classOf(42)).toBeUndefined()
    expect(classOf(700)).toBeUndefined()
  })
})

describe('search', () => {
  it('finds 418 by description text', () => {
    const hits = search('teapot')
    expect(hits.map((s) => s.code)).toContain(418)
  })

  it('matches a numeric query as a code prefix', () => {
    const codes = search('40').map((s) => s.code)
    expect(codes).toContain(400)
    expect(codes).toContain(404)
    expect(codes).not.toContain(500)
  })

  it('matches reason phrases case-insensitively', () => {
    const codes = search('NOT FOUND').map((s) => s.code)
    expect(codes).toContain(404)
  })

  it('returns the whole table for a blank query', () => {
    expect(search('')).toHaveLength(STATUS_CODES.length)
    expect(search('   ')).toHaveLength(STATUS_CODES.length)
  })
})
