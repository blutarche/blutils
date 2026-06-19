import { describe, expect, it } from 'vitest'
import { envToJson, jsonToEnv, parseEnv, toEnv } from './engine'

describe('parseEnv', () => {
  it('parses basics, skipping comments and blanks, tolerating export', () => {
    const text = ['# comment', '', 'export FOO=bar', 'BAZ="hello world"'].join(
      '\n',
    )
    expect(parseEnv(text)).toEqual({ FOO: 'bar', BAZ: 'hello world' })
  })

  it('strips single quotes literally without escape processing', () => {
    expect(parseEnv("QUOTED='a\\nb'")).toEqual({ QUOTED: 'a\\nb' })
  })

  it('unescapes \\n in double-quoted values', () => {
    expect(parseEnv('LINES="a\\nb\\tc"')).toEqual({ LINES: 'a\nb\tc' })
  })

  it('keeps the first = and trims unquoted values', () => {
    expect(parseEnv('URL=  postgres://u:p@h/db?x=1  ')).toEqual({
      URL: 'postgres://u:p@h/db?x=1',
    })
  })

  it('skips lines without an = sign', () => {
    expect(parseEnv('FOO=bar\nnot an assignment\nBAZ=qux')).toEqual({
      FOO: 'bar',
      BAZ: 'qux',
    })
  })

  it('drops prototype-polluting keys', () => {
    const obj = parseEnv('__proto__=polluted\nSAFE=ok')
    expect(obj).toEqual({ SAFE: 'ok' })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('toEnv', () => {
  it('double-quotes and escapes a value with spaces', () => {
    expect(toEnv({ MSG: 'hello world' })).toBe('MSG="hello world"')
  })

  it('quotes and escapes newlines and quotes', () => {
    expect(toEnv({ K: 'a\nb"c' })).toBe('K="a\\nb\\"c"')
  })

  it('leaves a simple value unquoted', () => {
    expect(toEnv({ FOO: 'bar' })).toBe('FOO=bar')
  })

  it('drops prototype-polluting keys', () => {
    expect(toEnv({ __proto__: 'x', SAFE: 'ok' } as Record<string, unknown>)).toBe(
      'SAFE=ok',
    )
  })
})

describe('round-trip', () => {
  it('preserves a simple map through env → json → env', () => {
    const map = { A: '1', B: 'two words', C: 'plain' }
    const roundTripped = parseEnv(toEnv(map))
    expect(roundTripped).toEqual(map)
  })
})

describe('envToJson / jsonToEnv', () => {
  it('envToJson emits pretty JSON', () => {
    expect(envToJson('FOO=bar')).toBe('{\n  "FOO": "bar"\n}')
  })

  it('jsonToEnv converts an object', () => {
    expect(jsonToEnv('{"FOO":"bar","MSG":"hi there"}')).toBe(
      'FOO=bar\nMSG="hi there"',
    )
  })

  it('jsonToEnv throws on a non-object', () => {
    expect(() => jsonToEnv('[1,2,3]')).toThrow()
    expect(() => jsonToEnv('"just a string"')).toThrow()
  })
})

describe('inline comments and key-injection hardening', () => {
  it('strips an inline comment after an unquoted value', () => {
    expect(parseEnv('FOO=bar # trailing comment')).toEqual({ FOO: 'bar' })
  })

  it('keeps a # that is part of an unquoted value (no space)', () => {
    expect(parseEnv('FOO=bar#baz')).toEqual({ FOO: 'bar#baz' })
  })

  it('reads a quoted value and ignores a trailing comment', () => {
    expect(parseEnv('FOO="bar baz" # note')).toEqual({ FOO: 'bar baz' })
  })

  it('rejects a JSON key that would inject an extra .env assignment', () => {
    expect(() => toEnv({ 'GOOD=1\nEVIL': 'x' })).toThrow(/invalid \.env key/)
    expect(() => toEnv({ 'has space': 'x' })).toThrow(/invalid \.env key/)
  })
})
