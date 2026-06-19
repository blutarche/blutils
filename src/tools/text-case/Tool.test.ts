import { describe, expect, it } from 'vitest'
import {
  CASES,
  camelCase,
  constantCase,
  kebabCase,
  lowerCase,
  pascalCase,
  sentenceCase,
  snakeCase,
  titleCase,
  tokenize,
  upperCase,
} from './engine'

const MIXED = 'hello world-foo_barBaz HTTPServer v2'

describe('tokenize', () => {
  it('splits separators, case humps, acronym runs, and digits', () => {
    expect(tokenize(MIXED)).toEqual([
      'hello',
      'world',
      'foo',
      'bar',
      'baz',
      'http',
      'server',
      'v',
      '2',
    ])
  })

  it('returns an empty list for empty / blank input', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   ')).toEqual([])
  })

  it('handles a single word', () => {
    expect(tokenize('hello')).toEqual(['hello'])
  })
})

describe('formatters — mixed input', () => {
  it('camelCase', () => {
    expect(camelCase(MIXED)).toBe('helloWorldFooBarBazHttpServerV2')
  })
  it('PascalCase', () => {
    expect(pascalCase(MIXED)).toBe('HelloWorldFooBarBazHttpServerV2')
  })
  it('snake_case', () => {
    expect(snakeCase(MIXED)).toBe('hello_world_foo_bar_baz_http_server_v_2')
  })
  it('kebab-case', () => {
    expect(kebabCase(MIXED)).toBe('hello-world-foo-bar-baz-http-server-v-2')
  })
  it('CONSTANT_CASE', () => {
    expect(constantCase(MIXED)).toBe('HELLO_WORLD_FOO_BAR_BAZ_HTTP_SERVER_V_2')
  })
  it('Title Case', () => {
    expect(titleCase(MIXED)).toBe('Hello World Foo Bar Baz Http Server V 2')
  })
  it('Sentence case', () => {
    expect(sentenceCase(MIXED)).toBe('Hello world foo bar baz http server v 2')
  })
  it('lower case', () => {
    expect(lowerCase(MIXED)).toBe('hello world foo bar baz http server v 2')
  })
  it('UPPER CASE', () => {
    expect(upperCase(MIXED)).toBe('HELLO WORLD FOO BAR BAZ HTTP SERVER V 2')
  })
})

describe('formatters — empty input', () => {
  it('every formatter yields an empty string', () => {
    for (const c of CASES) expect(c.fn('')).toBe('')
  })
})

describe('formatters — single word', () => {
  it('handles one bare word per case', () => {
    expect(camelCase('hello')).toBe('hello')
    expect(pascalCase('hello')).toBe('Hello')
    expect(snakeCase('hello')).toBe('hello')
    expect(kebabCase('hello')).toBe('hello')
    expect(constantCase('hello')).toBe('HELLO')
    expect(titleCase('hello')).toBe('Hello')
    expect(sentenceCase('hello')).toBe('Hello')
    expect(lowerCase('hello')).toBe('hello')
    expect(upperCase('hello')).toBe('HELLO')
  })
})

describe('idempotence — already-cased input round-trips through its own case', () => {
  it('camelCase', () => {
    expect(camelCase('fooBarBaz')).toBe('fooBarBaz')
  })
  it('PascalCase', () => {
    expect(pascalCase('FooBarBaz')).toBe('FooBarBaz')
  })
  it('snake_case', () => {
    expect(snakeCase('foo_bar_baz')).toBe('foo_bar_baz')
  })
  it('kebab-case', () => {
    expect(kebabCase('foo-bar-baz')).toBe('foo-bar-baz')
  })
  it('CONSTANT_CASE', () => {
    expect(constantCase('FOO_BAR_BAZ')).toBe('FOO_BAR_BAZ')
  })
  it('Title Case', () => {
    expect(titleCase('Foo Bar Baz')).toBe('Foo Bar Baz')
  })
  it('Sentence case', () => {
    expect(sentenceCase('Foo bar baz')).toBe('Foo bar baz')
  })
  it('lower case', () => {
    expect(lowerCase('foo bar baz')).toBe('foo bar baz')
  })
  it('UPPER CASE', () => {
    expect(upperCase('FOO BAR BAZ')).toBe('FOO BAR BAZ')
  })
})

describe('CASES registry', () => {
  it('exposes all nine cases with unique keys', () => {
    expect(CASES).toHaveLength(9)
    expect(new Set(CASES.map((c) => c.key)).size).toBe(9)
  })
})
