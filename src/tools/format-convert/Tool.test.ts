import { describe, expect, it } from 'vitest'
import {
  MAX_DEPTH,
  MAX_INPUT_BYTES,
  convert,
  parse,
  sanitize,
  serialize,
} from './engine'

const SAMPLE = {
  name: 'blutils',
  version: 2,
  enabled: true,
  tags: ['json', 'yaml'],
  meta: { author: 'ada', stars: 42 },
}

describe('round-trip JSON <-> YAML', () => {
  it('survives a round trip both directions', () => {
    const json = JSON.stringify(SAMPLE)
    const yaml = convert(json, 'json', 'yaml')
    const back = convert(yaml, 'yaml', 'json')
    expect(JSON.parse(back)).toEqual(SAMPLE)
  })
})

describe('round-trip JSON <-> TOML', () => {
  it('survives a round trip both directions', () => {
    const json = JSON.stringify(SAMPLE)
    const toml = convert(json, 'json', 'toml')
    const back = convert(toml, 'toml', 'json')
    expect(JSON.parse(back)).toEqual(SAMPLE)
  })
})

describe('CSV parsing', () => {
  it('parses a quoted field with a comma and an embedded newline', () => {
    const csv = 'name,note\nAda,"hello, world\nsecond line"'
    const rows = parse(csv, 'csv') as Record<string, unknown>[]
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      name: 'Ada',
      note: 'hello, world\nsecond line',
    })
  })
})

describe('CSV formula-injection hardening', () => {
  it('neutralizes a cell beginning with = via escapeFormulae', () => {
    const out = serialize([{ formula: '=1+1' }], 'csv')
    // escapeFormulae prefixes a leading apostrophe so spreadsheets
    // treat the cell as text rather than a live formula.
    expect(out).toContain("'=1+1")
    expect(out).not.toMatch(/(^|,)=1\+1/m)
  })
})

describe('date values survive sanitize', () => {
  it('keeps a YAML timestamp instead of collapsing it to {}', () => {
    const out = convert('when: 2024-01-02', 'yaml', 'json')
    expect(out).toContain('2024-01-02')
    expect(out).not.toContain('{}')
  })

  it('keeps a TOML datetime', () => {
    const out = convert('d = 2024-01-02T03:04:05Z', 'toml', 'json')
    expect(out).toContain('2024-01-02')
  })

  it('passes a Date through sanitize unchanged', () => {
    const d = new Date('2024-01-02T03:04:05Z')
    expect(sanitize(d)).toBe(d)
  })
})

describe('malformed CSV is reported, not swallowed', () => {
  it('throws on an unterminated quoted field', () => {
    expect(() => convert('a,b\n"unterminated,2', 'csv', 'json')).toThrow(
      /CSV parse error/,
    )
  })
})

describe('sanitize — prototype-pollution quarantine', () => {
  it('drops a __proto__ key and never pollutes Object.prototype', () => {
    const out = convert('{"__proto__":{"polluted":1}}', 'json', 'json')
    // The key is stripped from the rebuilt structure entirely.
    expect(JSON.parse(out)).toEqual({})
    // And the global prototype is untouched.
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('drops constructor and prototype keys too', () => {
    const cleaned = sanitize({
      constructor: 'x',
      prototype: 'y',
      keep: 'z',
    }) as Record<string, unknown>
    expect(cleaned).toEqual({ keep: 'z' })
  })
})

describe('input size limit', () => {
  it('throws when input exceeds MAX_INPUT_BYTES', () => {
    const huge = '"' + 'a'.repeat(MAX_INPUT_BYTES + 1) + '"'
    expect(() => parse(huge, 'json')).toThrow(/input too large/)
  })
})

describe('depth limit', () => {
  it('throws on a structure nested past MAX_DEPTH', () => {
    let deep: unknown = 1
    for (let i = 0; i < MAX_DEPTH + 5; i++) deep = { nested: deep }
    expect(() => sanitize(deep)).toThrow(/too deeply nested/)
  })
})

describe('TOML output validation', () => {
  it('throws when the value is not a top-level object', () => {
    expect(() => serialize([1, 2, 3], 'toml')).toThrow(/top-level object/)
  })
})

describe('CSV output validation', () => {
  it('throws when converting a non-array, non-object to CSV', () => {
    expect(() => serialize(42, 'csv')).toThrow(/array of rows or an object/)
  })

  it('wraps a single object as one row', () => {
    const out = serialize({ a: 1, b: 2 }, 'csv')
    expect(out).toBe('a,b\r\n1,2')
  })
})
