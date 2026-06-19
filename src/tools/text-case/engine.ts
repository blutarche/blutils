/**
 * text.case — pure case-conversion engine.
 *
 * Dependency-free and side-effect-free so the tokenizer and every
 * formatter can be unit-tested directly. The Tool just wires input
 * through `CASES`.
 *
 * Everything hinges on `tokenize`, which splits an arbitrary string
 * into lower-cased words. Once a string is a clean word list, each
 * formatter is a trivial join. The splitter handles:
 *   - separators: spaces (any run), `_`, `-`, `.`
 *   - camelCase / PascalCase humps (fooBar → foo, Bar)
 *   - acronym runs followed by a word (HTTPServer → HTTP, Server)
 *   - letter↔digit boundaries (v2 → v, 2; abc123 → abc, 123)
 */

/**
 * Split arbitrary text into lower-cased words.
 *
 * Strategy: replace explicit separators with spaces, insert spaces
 * at case/digit boundaries, then split on whitespace. The boundary
 * rules, in order of the regex passes:
 *   1. lower/digit → Upper      "fooBar"      → "foo Bar"
 *   2. Upper-run → Upper+lower   "HTTPServer"  → "HTTP Server"
 *   3. letter ↔ digit            "v2" / "2v"   → "v 2" / "2 v"
 */
export function tokenize(input: string): string[] {
  return input
    // explicit separators become spaces
    .replace(/[_\-.\s]+/g, ' ')
    // lowercase/digit immediately before an uppercase: "fooB" → "foo B"
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    // end of an acronym run before a word: "HTTPServer" → "HTTP Server"
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // letter→digit boundary: "abc123" → "abc 123"
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    // digit→letter boundary: "123abc" → "123 abc"
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.toLowerCase())
}

function upperFirst(word: string): string {
  return word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1)
}

export function camelCase(input: string): string {
  const words = tokenize(input)
  return words.map((w, i) => (i === 0 ? w : upperFirst(w))).join('')
}

export function pascalCase(input: string): string {
  return tokenize(input).map(upperFirst).join('')
}

export function snakeCase(input: string): string {
  return tokenize(input).join('_')
}

export function kebabCase(input: string): string {
  return tokenize(input).join('-')
}

export function constantCase(input: string): string {
  return tokenize(input)
    .map((w) => w.toUpperCase())
    .join('_')
}

export function titleCase(input: string): string {
  return tokenize(input).map(upperFirst).join(' ')
}

export function sentenceCase(input: string): string {
  const words = tokenize(input)
  return words.map((w, i) => (i === 0 ? upperFirst(w) : w)).join(' ')
}

export function lowerCase(input: string): string {
  return tokenize(input).join(' ')
}

export function upperCase(input: string): string {
  return tokenize(input)
    .map((w) => w.toUpperCase())
    .join(' ')
}

export interface CaseDef {
  /** Stable identity used in Op ids and the UI key. */
  key: string
  /** Human label shown beside the output. */
  label: string
  fn: (input: string) => string
}

/** Ordered registry so the UI and ops iterate the same set. */
export const CASES: readonly CaseDef[] = [
  { key: 'camel', label: 'camelCase', fn: camelCase },
  { key: 'pascal', label: 'PascalCase', fn: pascalCase },
  { key: 'snake', label: 'snake_case', fn: snakeCase },
  { key: 'kebab', label: 'kebab-case', fn: kebabCase },
  { key: 'constant', label: 'CONSTANT_CASE', fn: constantCase },
  { key: 'title', label: 'Title Case', fn: titleCase },
  { key: 'sentence', label: 'Sentence case', fn: sentenceCase },
  { key: 'lower', label: 'lower case', fn: lowerCase },
  { key: 'upper', label: 'UPPER CASE', fn: upperCase },
]
