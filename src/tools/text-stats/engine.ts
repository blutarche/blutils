/**
 * text.stats — pure text-statistics engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * without a DOM. The Tool wires it to the live textarea value.
 *
 * Every count is a documented heuristic; none of them claim to be
 * a linguistically rigorous parse. Choices below favour the
 * intuitive answer a developer eyeballing a paragraph would give.
 */

export interface TextStats {
  /** Unicode code points, not UTF-16 units. `[...text].length`
   *  counts an astral character (e.g. an emoji) as one. */
  chars: number
  /** Code points that are not whitespace. */
  charsNoSpaces: number
  /** UTF-8 byte length via TextEncoder. */
  bytes: number
  /** Whitespace-delimited tokens; empty tokens dropped, so leading,
   *  trailing, and repeated separators don't inflate the count. */
  words: number
  /** Newline-delimited lines. Empty text is 0 lines; any non-empty
   *  text has at least 1 (a string with no '\n' is one line). */
  lines: number
  /** Runs ending in a terminal punctuation mark (. ! ?). Consecutive
   *  terminators ("?!", "...") collapse into one sentence — a simple
   *  heuristic that ignores abbreviations and decimals. */
  sentences: number
  /** Blocks separated by one or more blank lines, ignoring blocks
   *  that are empty once trimmed. */
  paragraphs: number
  /** words / 200, rounded up. 200 wpm is a common silent-reading
   *  average. 0 when there are no words; otherwise at least 1. */
  readingTimeMin: number
}

const WORDS_PER_MINUTE = 200

/** UTF-8 byte length. TextEncoder is universal in browsers and
 *  Node 11+; the engine assumes it exists. */
function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length
}

export function stats(text: string): TextStats {
  // Spread iterates by code point, so surrogate pairs stay whole.
  const codePoints = [...text]
  const chars = codePoints.length
  const charsNoSpaces = codePoints.filter((c) => !/\s/.test(c)).length
  const bytes = utf8Bytes(text)

  // Trim first so a buffer of only whitespace yields zero words.
  const trimmed = text.trim()
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length

  // An empty buffer is zero lines; otherwise newlines + 1.
  const lines = text === '' ? 0 : text.split('\n').length

  // Each match is one run of one-or-more terminal marks => one sentence.
  const sentences = (text.match(/[.!?]+/g) ?? []).length

  // Split on blank-line boundaries, then keep only non-empty blocks.
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim() !== '').length

  const readingTimeMin = words === 0 ? 0 : Math.ceil(words / WORDS_PER_MINUTE)

  return {
    chars,
    charsNoSpaces,
    bytes,
    words,
    lines,
    sentences,
    paragraphs,
    readingTimeMin,
  }
}
