/**
 * text.slug — pure slugify engine.
 *
 * Dependency-free so it can be unit-tested in isolation and reused
 * by the chain Op. The transform is a fixed pipeline:
 *
 *   1. NFKD-normalize and strip combining marks, so accented Latin
 *      letters fold to their base form ("Crème Brûlée" → "Creme
 *      Brulee") rather than being dropped wholesale.
 *   2. Lowercase (optional, on by default).
 *   3. Replace every run of non-alphanumeric characters with the
 *      separator — this both substitutes spaces/symbols and
 *      collapses repeats in one pass.
 *   4. Trim leading/trailing separators.
 *
 * The pipeline is idempotent: feeding an existing slug back in
 * returns it unchanged.
 */

export type Separator = '-' | '_'

export interface SlugifyOptions {
  /** Joining character between words. Default '-'. */
  separator?: Separator
  /** Lowercase the result. Default true. */
  lower?: boolean
  /**
   * Reserved for future use; currently the engine is always
   * strict (only [a-z0-9] plus the separator survive).
   */
  strict?: boolean
}

const COMBINING_MARKS = /[̀-ͯ]/g

/** Escape a single character for safe use in a RegExp character class. */
function escapeForClass(ch: string): string {
  return ch.replace(/[\\\]^-]/g, '\\$&')
}

export function slugify(text: string, options: SlugifyOptions = {}): string {
  const separator: Separator = options.separator ?? '-'
  const lower = options.lower ?? true

  let s = text.normalize('NFKD').replace(COMBINING_MARKS, '')
  if (lower) s = s.toLowerCase()

  // Anything that isn't a letter or digit becomes a separator;
  // consecutive runs collapse to a single one.
  s = s.replace(/[^a-zA-Z0-9]+/g, separator)

  // Trim leading/trailing separators left by edge punctuation.
  const sep = escapeForClass(separator)
  s = s.replace(new RegExp(`^${sep}+|${sep}+$`, 'g'), '')

  return s
}
