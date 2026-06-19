import { describe, expect, it } from 'vitest'
import { diffJson, parseAndDiff, type JsonChange } from './engine'

describe('diffJson', () => {
  it('returns no changes for identical objects', () => {
    expect(diffJson({ a: 1, b: [1, 2], c: { d: 3 } }, { a: 1, b: [1, 2], c: { d: 3 } })).toEqual([])
  })

  it('treats key-order differences as no diff', () => {
    expect(diffJson({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([])
  })

  it('reports an added key with its after value', () => {
    expect(diffJson({ a: 1 }, { a: 1, b: 2 })).toEqual<JsonChange[]>([
      { path: '$.b', type: 'added', after: 2 },
    ])
  })

  it('reports a removed key with its before value', () => {
    expect(diffJson({ a: 1, b: 2 }, { a: 1 })).toEqual<JsonChange[]>([
      { path: '$.b', type: 'removed', before: 2 },
    ])
  })

  it('reports a changed primitive with before and after', () => {
    expect(diffJson({ a: 1 }, { a: 2 })).toEqual<JsonChange[]>([
      { path: '$.a', type: 'changed', before: 1, after: 2 },
    ])
  })

  it('reports a nested object change at the deep path', () => {
    expect(diffJson({ user: { name: 'Ada' } }, { user: { name: 'Bea' } })).toEqual<JsonChange[]>([
      { path: '$.user.name', type: 'changed', before: 'Ada', after: 'Bea' },
    ])
  })

  it('reports an array element change at its index', () => {
    expect(diffJson({ tags: ['a', 'b', 'c'] }, { tags: ['a', 'b', 'z'] })).toEqual<JsonChange[]>([
      { path: '$.tags[2]', type: 'changed', before: 'c', after: 'z' },
    ])
  })

  it('treats a type change (number -> string) as changed, not add+remove', () => {
    expect(diffJson({ a: 1 }, { a: '1' })).toEqual<JsonChange[]>([
      { path: '$.a', type: 'changed', before: 1, after: '1' },
    ])
  })

  it('treats array order as significant', () => {
    expect(diffJson([1, 2], [2, 1])).toEqual<JsonChange[]>([
      { path: '$[0]', type: 'changed', before: 1, after: 2 },
      { path: '$[1]', type: 'changed', before: 2, after: 1 },
    ])
  })

  it('reports surplus array elements as added / removed', () => {
    expect(diffJson([1], [1, 2])).toEqual<JsonChange[]>([
      { path: '$[1]', type: 'added', after: 2 },
    ])
    expect(diffJson([1, 2], [1])).toEqual<JsonChange[]>([
      { path: '$[1]', type: 'removed', before: 2 },
    ])
  })

  it('treats a container-vs-primitive mismatch as a single change', () => {
    expect(diffJson({ a: { b: 1 } }, { a: 5 })).toEqual<JsonChange[]>([
      { path: '$.a', type: 'changed', before: { b: 1 }, after: 5 },
    ])
  })

  it('treats array vs object as a single change at the root', () => {
    expect(diffJson([1, 2], { 0: 1, 1: 2 })).toEqual<JsonChange[]>([
      { path: '$', type: 'changed', before: [1, 2], after: { 0: 1, 1: 2 } },
    ])
  })

  it('uses bracket-quote notation for non-identifier keys', () => {
    expect(diffJson({ 'a-b': 1 }, { 'a-b': 2 })).toEqual<JsonChange[]>([
      { path: '$["a-b"]', type: 'changed', before: 1, after: 2 },
    ])
  })

  it('emits a root change when two scalars differ', () => {
    expect(diffJson(1, 2)).toEqual<JsonChange[]>([
      { path: '$', type: 'changed', before: 1, after: 2 },
    ])
  })

  it('collects multiple changes in document order', () => {
    const a = { a: 1, b: 2, c: 3 }
    const b = { a: 1, b: 9, d: 4 }
    expect(diffJson(a, b)).toEqual<JsonChange[]>([
      { path: '$.b', type: 'changed', before: 2, after: 9 },
      { path: '$.c', type: 'removed', before: 3 },
      { path: '$.d', type: 'added', after: 4 },
    ])
  })
})

describe('parseAndDiff', () => {
  it('parses both sides and diffs them', () => {
    const r = parseAndDiff('{"a":1}', '{"a":2}')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.changes).toEqual<JsonChange[]>([
        { path: '$.a', type: 'changed', before: 1, after: 2 },
      ])
    }
  })

  it('returns no changes for equal documents with reordered keys', () => {
    const r = parseAndDiff('{"a":1,"b":2}', '{"b":2,"a":1}')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.changes).toEqual([])
  })

  it('flags invalid JSON on side A without throwing', () => {
    const r = parseAndDiff('{not json}', '{}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/^A is invalid JSON/)
  })

  it('flags invalid JSON on side B without throwing', () => {
    const r = parseAndDiff('{}', '{nope}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/^B is invalid JSON/)
  })
})

describe('deep nesting is bounded', () => {
  it('throws a controlled error past the depth cap (no stack overflow)', () => {
    // Built in JS (not via JSON.parse, which would overflow first) to
    // exercise diffJson's own depth guard directly.
    let a: unknown = 0
    let b: unknown = 1
    for (let i = 0; i < 400; i++) {
      a = [a]
      b = [b]
    }
    expect(() => diffJson(a, b)).toThrow(/deeply nested/)
  })
})
