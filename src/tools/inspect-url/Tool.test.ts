import { describe, expect, it } from 'vitest'
import { parseUrl } from './engine'

describe('parseUrl — full URL', () => {
  const url = 'https://user:pass@example.com:8443/a/b?x=1&y=2&x=3#frag'

  it('extracts the core components', () => {
    const p = parseUrl(url)
    expect(p.protocol).toBe('https:')
    expect(p.username).toBe('user')
    expect(p.password).toBe('pass')
    expect(p.hostname).toBe('example.com')
    expect(p.host).toBe('example.com:8443')
    expect(p.port).toBe('8443')
    expect(p.pathname).toBe('/a/b')
    expect(p.search).toBe('?x=1&y=2&x=3')
    expect(p.hash).toBe('#frag')
  })

  it('preserves duplicate query keys in order', () => {
    const p = parseUrl(url)
    expect(p.params).toEqual([
      ['x', '1'],
      ['y', '2'],
      ['x', '3'],
    ])
  })
})

describe('parseUrl — query handling', () => {
  it('yields empty params for a URL with no query', () => {
    const p = parseUrl('https://example.com/path')
    expect(p.params).toEqual([])
    expect(p.search).toBe('')
  })

  it('decodes percent-encoded param values', () => {
    const p = parseUrl('https://example.com/?q=a%20b')
    expect(p.params).toEqual([['q', 'a b']])
  })
})

describe('parseUrl — invalid input', () => {
  it('throws on a non-URL string', () => {
    expect(() => parseUrl('not a url')).toThrow()
  })

  it('throws on a bare hostname with no scheme', () => {
    expect(() => parseUrl('example.com')).toThrow()
  })

  it('throws on empty input', () => {
    expect(() => parseUrl('   ')).toThrow()
  })
})
