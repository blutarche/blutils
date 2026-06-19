import { describe, expect, it } from 'vitest'
import { jsonToTypes, pascalCase, singularize } from './engine'

describe('pascalCase', () => {
  it('upper-cases and joins word boundaries', () => {
    expect(pascalCase('user_name')).toBe('UserName')
    expect(pascalCase('first-name')).toBe('FirstName')
  })

  it('splits camelCase humps', () => {
    expect(pascalCase('lastLogin')).toBe('LastLogin')
  })

  it('drops a leading digit run', () => {
    expect(pascalCase('123abc')).toBe('Abc')
  })
})

describe('singularize', () => {
  it('handles common plural suffixes', () => {
    expect(singularize('users')).toBe('user')
    expect(singularize('categories')).toBe('category')
    expect(singularize('boxes')).toBe('box')
    expect(singularize('dishes')).toBe('dish')
  })

  it('leaves non-plural or ambiguous names alone', () => {
    expect(singularize('address')).toBe('address')
    expect(singularize('meta')).toBe('meta')
  })
})

describe('jsonToTypes — primitives and nesting', () => {
  it('infers interfaces with nested object types', () => {
    const out = jsonToTypes('{"id":1,"name":"a","tags":["x"],"meta":{"k":true}}')
    expect(out).toContain('export interface Root {')
    expect(out).toContain('id: number')
    expect(out).toContain('name: string')
    expect(out).toContain('tags: string[]')
    expect(out).toContain('meta: Meta')
    expect(out).toContain('export interface Meta {')
    expect(out).toContain('k: boolean')
  })

  it('emits nested interfaces before the root', () => {
    const out = jsonToTypes('{"meta":{"k":true}}')
    expect(out.indexOf('interface Meta')).toBeLessThan(
      out.indexOf('interface Root'),
    )
  })
})

describe('jsonToTypes — arrays of objects', () => {
  it('merges shapes and marks missing keys optional', () => {
    const out = jsonToTypes('{"items":[{"a":1,"b":2},{"a":3}]}')
    expect(out).toContain('export interface Item {')
    expect(out).toContain('a: number')
    expect(out).toContain('b?: number')
    expect(out).toContain('items: Item[]')
  })

  it('singularises the element interface name', () => {
    const out = jsonToTypes('{"users":[{"id":1}]}')
    expect(out).toContain('users: User[]')
    expect(out).toContain('export interface User {')
  })
})

describe('jsonToTypes — unions and edges', () => {
  it('unions mixed primitive array element types', () => {
    const out = jsonToTypes('{"vals":[1,"x",true]}')
    expect(out).toMatch(/vals: \((number \| string \| boolean)\)\[\]/)
  })

  it('falls back to unknown[] on an empty array', () => {
    const out = jsonToTypes('{"empty":[]}')
    expect(out).toContain('empty: unknown[]')
  })

  it('includes null in the property type', () => {
    const out = jsonToTypes('{"nick":null}')
    expect(out).toContain('nick: null')
  })

  it('unions a value that is null in one element and set in another', () => {
    const out = jsonToTypes('[{"x":null},{"x":1}]')
    expect(out).toMatch(/x: (null \| number|number \| null)/)
  })
})

describe('jsonToTypes — root shapes', () => {
  it('aliases a non-object root', () => {
    expect(jsonToTypes('42')).toBe('export type Root = number\n')
    expect(jsonToTypes('"hi"')).toBe('export type Root = string\n')
  })

  it('honours a custom root name', () => {
    const out = jsonToTypes('{"k":1}', { rootName: 'Config' })
    expect(out).toContain('export interface Config {')
  })

  it('quotes keys that are not valid identifiers', () => {
    const out = jsonToTypes('{"a-b":1}')
    expect(out).toContain('"a-b": number')
  })
})

describe('jsonToTypes — errors', () => {
  it('throws on invalid JSON', () => {
    expect(() => jsonToTypes('{not json}')).toThrow(/Invalid JSON/)
  })
})
