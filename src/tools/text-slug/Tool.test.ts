import { describe, expect, it } from 'vitest'
import { slugify } from './engine'

describe('slugify', () => {
  it('lowercases and joins words with a hyphen', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('folds accents to their base letters', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee')
  })

  it('collapses runs of spaces and symbols into one separator', () => {
    expect(slugify('foo   ---  &&&  bar')).toBe('foo-bar')
  })

  it('trims leading and trailing punctuation', () => {
    expect(slugify('  !!Hello!!  ')).toBe('hello')
  })

  it('supports an underscore separator', () => {
    expect(slugify('Hello, World!', { separator: '_' })).toBe('hello_world')
  })

  it('preserves case when lower is false', () => {
    expect(slugify('Hello World', { lower: false })).toBe('Hello-World')
  })

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('returns an empty string when nothing alphanumeric survives', () => {
    expect(slugify('---  &&&  ---')).toBe('')
  })

  it('is idempotent on an existing slug', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug')
  })

  it('is idempotent on an existing underscore slug', () => {
    expect(slugify('already_a_slug', { separator: '_' })).toBe('already_a_slug')
  })

  it('keeps digits', () => {
    expect(slugify('Top 10 Tips')).toBe('top-10-tips')
  })
})
