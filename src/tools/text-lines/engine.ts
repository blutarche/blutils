/**
 * text.lines — pure line-oriented string transforms.
 *
 * Dependency-free and deterministic so every operation can be
 * unit-tested directly and reused as a canonical Chain Op.
 *
 * Newline handling: input is split on CRLF, CR, or LF so mixed
 * line endings normalise to a single convention, and output is
 * always joined back with `\n`. A trailing newline therefore
 * surfaces as a trailing empty line in the array and is preserved
 * through the transform unless the operation removes blank lines.
 *
 * Sorting uses `localeCompare`, which gives locale-aware ordering
 * (and, with `{ numeric: true }`, natural numeric ordering so that
 * "item2" sorts before "item10"). The `caseInsensitive` option
 * folds case via the `sensitivity: 'accent'` collator setting.
 */

const splitLines = (text: string): string[] => text.split(/\r\n|\r|\n/)

const join = (lines: string[]): string => lines.join('\n')

interface SortOptions {
  caseInsensitive?: boolean
}

const compare = (a: string, b: string, opts: SortOptions): number =>
  a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: opts.caseInsensitive ? 'accent' : 'variant',
  })

/** Sort lines ascending. Stable per the spec's locale compare. */
export function sortAsc(text: string, opts: SortOptions = {}): string {
  return join([...splitLines(text)].sort((a, b) => compare(a, b, opts)))
}

/** Sort lines descending. */
export function sortDesc(text: string, opts: SortOptions = {}): string {
  return join([...splitLines(text)].sort((a, b) => compare(b, a, opts)))
}

/** Drop duplicate lines, keeping the first occurrence (stable). */
export function dedupe(text: string): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of splitLines(text)) {
    if (seen.has(line)) continue
    seen.add(line)
    out.push(line)
  }
  return join(out)
}

/** Reverse the order of the lines. */
export function reverseLines(text: string): string {
  return join(splitLines(text).reverse())
}

/** Trim leading and trailing whitespace from each line. */
export function trimLines(text: string): string {
  return join(splitLines(text).map((line) => line.trim()))
}

/** Remove lines that are empty or whitespace-only. */
export function removeBlankLines(text: string): string {
  return join(splitLines(text).filter((line) => line.trim().length > 0))
}

/** Count of lines (LF/CR/CRLF aware) in a buffer. */
export function lineCount(text: string): number {
  return splitLines(text).length
}

export interface LineOperation {
  /** Stable key for UI iteration and Op ids. */
  id: string
  /** Display label. */
  label: string
  /** Pure transform. Sort variants honour caseInsensitive. */
  fn: (text: string, opts?: SortOptions) => string
}

/** Registry for UI iteration over the available operations. */
export const operations: readonly LineOperation[] = [
  { id: 'sort-asc', label: 'sort A→Z', fn: sortAsc },
  { id: 'sort-desc', label: 'sort Z→A', fn: sortDesc },
  { id: 'dedupe', label: 'unique', fn: (t) => dedupe(t) },
  { id: 'reverse', label: 'reverse', fn: (t) => reverseLines(t) },
  { id: 'trim', label: 'trim', fn: (t) => trimLines(t) },
  { id: 'remove-blank', label: 'remove blank', fn: (t) => removeBlankLines(t) },
] as const
