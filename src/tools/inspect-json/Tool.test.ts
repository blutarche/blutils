import { describe, expect, it } from 'vitest'
import { buildNodes, parseJson, previewOf, valueType } from './engine'

describe('parseJson', () => {
  it('returns ok with the parsed value for valid JSON', () => {
    const r = parseJson('{"a":1}')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ a: 1 })
  })

  it('parses scalars, arrays, and null', () => {
    expect(parseJson('null')).toEqual({ ok: true, value: null })
    expect(parseJson('[1,2]')).toEqual({ ok: true, value: [1, 2] })
    expect(parseJson('"x"')).toEqual({ ok: true, value: 'x' })
  })

  it('returns a bad flag (never throws) on invalid JSON', () => {
    const r = parseJson('{not json}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(typeof r.error).toBe('string')
  })

  it('does not throw on empty input', () => {
    expect(() => parseJson('')).not.toThrow()
    expect(parseJson('').ok).toBe(false)
  })
})

describe('valueType', () => {
  it('classifies every JSON type', () => {
    expect(valueType(null)).toBe('null')
    expect(valueType([])).toBe('array')
    expect(valueType({})).toBe('object')
    expect(valueType(1)).toBe('number')
    expect(valueType(true)).toBe('boolean')
    expect(valueType('s')).toBe('string')
  })
})

describe('previewOf', () => {
  it('quotes strings and renders scalars raw', () => {
    expect(previewOf('hi')).toBe('"hi"')
    expect(previewOf(42)).toBe('42')
    expect(previewOf(false)).toBe('false')
    expect(previewOf(null)).toBe('null')
  })

  it('summarizes containers with pluralized counts', () => {
    expect(previewOf({})).toBe('{…} 0 keys')
    expect(previewOf({ a: 1 })).toBe('{…} 1 key')
    expect(previewOf({ a: 1, b: 2 })).toBe('{…} 2 keys')
    expect(previewOf([])).toBe('[…] 0 items')
    expect(previewOf([1])).toBe('[…] 1 item')
    expect(previewOf([1, 2])).toBe('[…] 2 items')
  })
})

describe('buildNodes', () => {
  const value = { a: 1, b: [true, null, 'x'], c: { d: 2 } }
  const nodes = buildNodes(value)

  it('emits one node per value including the root', () => {
    // root + a + b + b[0..2] + c + c.d = 1 + 1 + 1 + 3 + 1 + 1 = 8
    expect(nodes).toHaveLength(8)
  })

  it('emits nodes in document order with the right JSON paths', () => {
    expect(nodes.map((n) => n.path)).toEqual([
      '$',
      '$.a',
      '$.b',
      '$.b[0]',
      '$.b[1]',
      '$.b[2]',
      '$.c',
      '$.c.d',
    ])
  })

  it('tags each node with the correct type', () => {
    const byPath = new Map(nodes.map((n) => [n.path, n]))
    expect(byPath.get('$')!.type).toBe('object')
    expect(byPath.get('$.a')!.type).toBe('number')
    expect(byPath.get('$.b')!.type).toBe('array')
    expect(byPath.get('$.b[0]')!.type).toBe('boolean')
    expect(byPath.get('$.b[1]')!.type).toBe('null')
    expect(byPath.get('$.b[2]')!.type).toBe('string')
    expect(byPath.get('$.c')!.type).toBe('object')
    expect(byPath.get('$.c.d')!.type).toBe('number')
  })

  it('builds previews for containers and scalars', () => {
    const byPath = new Map(nodes.map((n) => [n.path, n]))
    expect(byPath.get('$')!.preview).toBe('{…} 3 keys')
    expect(byPath.get('$.b')!.preview).toBe('[…] 3 items')
    expect(byPath.get('$.b[2]')!.preview).toBe('"x"')
    expect(byPath.get('$.c')!.preview).toBe('{…} 1 key')
    expect(byPath.get('$.c.d')!.preview).toBe('2')
  })

  it('tracks depth from the root', () => {
    const byPath = new Map(nodes.map((n) => [n.path, n]))
    expect(byPath.get('$')!.depth).toBe(0)
    expect(byPath.get('$.a')!.depth).toBe(1)
    expect(byPath.get('$.b[0]')!.depth).toBe(2)
    expect(byPath.get('$.c.d')!.depth).toBe(2)
  })

  it('marks only objects and arrays collapsible', () => {
    const byPath = new Map(nodes.map((n) => [n.path, n]))
    expect(byPath.get('$')!.collapsible).toBe(true)
    expect(byPath.get('$.b')!.collapsible).toBe(true)
    expect(byPath.get('$.a')!.collapsible).toBe(false)
    expect(byPath.get('$.b[0]')!.collapsible).toBe(false)
  })

  it('uses bracket-quote notation for non-identifier keys', () => {
    const paths = buildNodes({ 'a-b': 1, '1x': 2 }).map((n) => n.path)
    expect(paths).toContain('$["a-b"]')
    expect(paths).toContain('$["1x"]')
  })

  it('previews an empty root container', () => {
    expect(buildNodes({})).toEqual([
      { key: '$', type: 'object', preview: '{…} 0 keys', depth: 0, path: '$', collapsible: true },
    ])
    expect(buildNodes([])).toEqual([
      { key: '$', type: 'array', preview: '[…] 0 items', depth: 0, path: '$', collapsible: true },
    ])
  })

  it('handles a scalar root', () => {
    expect(buildNodes(42)).toEqual([
      { key: '$', type: 'number', preview: '42', depth: 0, path: '$', collapsible: false },
    ])
  })
})
