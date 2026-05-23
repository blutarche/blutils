import type { Detector } from '../../types'

/**
 * Match two blocks separated by a `---` line — the conventional
 * "paste two versions" shape. We split on the separator and seed
 * the A and B halves through a JSON-encoded pair so the Tool's
 * useToolInput slices each pick up their side.
 *
 * Confidence is moderate because the separator can show up in
 * markdown frontmatter and chat transcripts; the strip is just a
 * suggestion.
 */
export const detect: Detector = (text) => {
  if (!text.includes('\n---\n')) return null
  const [a, b, rest] = text.split('\n---\n')
  if (a === undefined || b === undefined || rest !== undefined) return null
  if (a.length === 0 || b.length === 0) return null
  return {
    confidence: 0.65,
    label: 'two blocks — diff?',
    // The Tool reads two slices; encode both so the detect strip
    // pre-seeds A and B in one shot. The strip handler in Palette
    // splits the JSON envelope back into the two session keys.
    initialInput: JSON.stringify({ a, b }),
  }
}
