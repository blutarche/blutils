import { describe, expect, it } from 'vitest'
import { decode, encode } from './engine'
import { ops } from './ops'

describe('encode — basics', () => {
  it('escapes the five markup-significant characters', () => {
    expect(encode('& < > " \'')).toBe('&amp; &lt; &gt; &quot; &#39;')
  })

  it('uses &#39; for the apostrophe (not &apos;)', () => {
    expect(encode("it's")).toBe('it&#39;s')
  })

  it('escapes & first so &amp; is not double-encoded', () => {
    // The literal `&` becomes `&amp;` exactly once — the `&` it
    // introduces must not be re-escaped into `&amp;amp;`.
    expect(encode('a & b')).toBe('a &amp; b')
    expect(encode('&amp;')).toBe('&amp;amp;')
  })

  it('leaves plain ASCII text untouched', () => {
    expect(encode('hello world 123')).toBe('hello world 123')
  })
})

describe('encode — non-ASCII to numeric', () => {
  it('converts é to a decimal numeric entity', () => {
    expect(encode('é', { nonAscii: true })).toBe('&#233;')
  })

  it('converts an astral emoji code-point-aware', () => {
    expect(encode('😀', { nonAscii: true })).toBe('&#128512;')
  })

  it('still escapes the basics alongside non-ASCII', () => {
    expect(encode('café & <b>', { nonAscii: true })).toBe(
      'caf&#233; &amp; &lt;b&gt;',
    )
  })

  it('does not touch non-ASCII when the toggle is off', () => {
    expect(encode('café')).toBe('café')
  })
})

describe('decode — named', () => {
  it('decodes the five basics', () => {
    expect(decode('&amp; &lt; &gt; &quot; &apos;')).toBe('& < > " \'')
  })

  it('decodes common symbol entities', () => {
    expect(decode('&copy;&reg;&trade;&mdash;&euro;&nbsp;')).toBe('©®™—€ ')
  })

  it('passes unknown named entities through unchanged', () => {
    expect(decode('&bogus; &notanentity;')).toBe('&bogus; &notanentity;')
  })
})

describe('decode — numeric', () => {
  it('decodes a decimal numeric entity', () => {
    expect(decode('&#233;')).toBe('é')
  })

  it('decodes a hex numeric entity (lower and upper x)', () => {
    expect(decode('&#xe9;')).toBe('é')
    expect(decode('&#Xe9;')).toBe('é')
  })

  it('decodes an astral numeric entity surrogate-safely', () => {
    expect(decode('&#128512;')).toBe('😀')
    expect(decode('&#x1f600;')).toBe('😀')
  })

  it('passes an out-of-range numeric entity through', () => {
    expect(decode('&#xFFFFFFFF;')).toBe('&#xFFFFFFFF;')
  })

  it('maps a lone surrogate and NUL to the replacement char', () => {
    // 0xD800 is a lone surrogate — not a valid scalar value.
    expect(decode('&#55296;')).toBe('�')
    expect(decode('&#xD800;')).toBe('�')
    expect(decode('&#0;')).toBe('�')
  })
})

describe('round-trip', () => {
  const cases = ['& < > " \'', '<a href="x">Tom & Jerry</a>', 'plain text']

  it('encode → decode is identity (basics)', () => {
    for (const s of cases) {
      expect(decode(encode(s))).toBe(s)
    }
  })

  it('encode → decode is identity with non-ASCII numeric', () => {
    for (const s of ['café 😀', '<b>é</b> & ©']) {
      expect(decode(encode(s, { nonAscii: true }))).toBe(s)
    }
  })
})

describe('ops', () => {
  it('exposes html.encode and html.decode', () => {
    expect(ops.map((o) => o.id)).toEqual(['html.encode', 'html.decode'])
  })

  it('encode op round-trips through decode op', async () => {
    const enc = ops.find((o) => o.id === 'html.encode')!
    const dec = ops.find((o) => o.id === 'html.decode')!
    const s = '<a href="x">Tom & Jerry\'s</a>'
    expect(await dec.fn(await enc.fn(s))).toBe(s)
  })
})
