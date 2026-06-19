import { describe, expect, it } from 'vitest'
import { stats } from './engine'

describe('stats — empty input', () => {
  it('is all zero, including reading time', () => {
    expect(stats('')).toEqual({
      chars: 0,
      charsNoSpaces: 0,
      bytes: 0,
      words: 0,
      lines: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMin: 0,
    })
  })

  it('treats a whitespace-only buffer as zero words', () => {
    const s = stats('   \n\t  ')
    expect(s.words).toBe(0)
    expect(s.readingTimeMin).toBe(0)
  })
})

describe('stats — "Hello world"', () => {
  const s = stats('Hello world')

  it('counts 2 words', () => {
    expect(s.words).toBe(2)
  })

  it('counts 11 chars and 10 without spaces', () => {
    expect(s.chars).toBe(11)
    expect(s.charsNoSpaces).toBe(10)
  })

  it('is one line, no sentences, one paragraph', () => {
    expect(s.lines).toBe(1)
    expect(s.sentences).toBe(0)
    expect(s.paragraphs).toBe(1)
  })
})

describe('stats — multi-line, multi-paragraph, multi-sentence sample', () => {
  // 2 paragraphs separated by a blank line.
  // Para 1: 3 sentences ("." , "!" , "?"). Para 2: 1 sentence (".").
  const sample =
    'First line here. Second sentence! Third?\nStill paragraph one.\n\n' +
    'A new paragraph begins.'

  const s = stats(sample)

  it('counts lines split on newline', () => {
    // 'First...', 'Still...', '', 'A new...' => 4 lines.
    expect(s.lines).toBe(4)
  })

  it('counts paragraphs across the blank line', () => {
    expect(s.paragraphs).toBe(2)
  })

  it('counts sentences by terminal punctuation runs', () => {
    expect(s.sentences).toBe(5)
  })

  it('counts whitespace-separated words across newlines', () => {
    // First(1) line(2) here.(3) Second(4) sentence!(5) Third?(6)
    // Still(7) paragraph(8) one.(9) A(10) new(11) paragraph(12) begins.(13)
    expect(s.words).toBe(13)
  })
})

describe('stats — multibyte', () => {
  it('counts an emoji as one code point but more than one byte', () => {
    const s = stats('😀')
    expect(s.chars).toBe(1)
    expect(s.charsNoSpaces).toBe(1)
    expect(s.bytes).toBe(4) // grinning face is 4 UTF-8 bytes
  })
})

describe('stats — reading time', () => {
  it('is ~1 minute for ~200 words', () => {
    const text = Array.from({ length: 200 }, () => 'word').join(' ')
    const s = stats(text)
    expect(s.words).toBe(200)
    expect(s.readingTimeMin).toBe(1)
  })

  it('rounds up past the per-minute rate', () => {
    const text = Array.from({ length: 201 }, () => 'word').join(' ')
    expect(stats(text).readingTimeMin).toBe(2)
  })

  it('is at least 1 minute for any words', () => {
    expect(stats('one').readingTimeMin).toBe(1)
  })
})
