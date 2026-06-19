import type { Detector } from '../../types'

/**
 * Percent-encoded text: contains at least one `%XX` hex escape and
 * decodes cleanly to something different from the input. The decode
 * guard rejects strings that merely contain a stray `%` (which would
 * throw) and strings where decoding is a no-op.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (!/%[0-9A-Fa-f]{2}/.test(t)) return null
  try {
    const decoded = decodeURIComponent(t)
    if (decoded === t) return null
    return { confidence: 0.55, label: 'URL-encoded text', initialInput: t }
  } catch {
    return null
  }
}
