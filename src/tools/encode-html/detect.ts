import type { Detector } from '../../types'

/**
 * HTML-entity candidate: text carrying at least one recognisable
 * named or numeric entity. Mid-confidence so a more specific
 * Detector (e.g. a full HTML document) can still win.
 */
export const detect: Detector = (text) => {
  if (!/&(amp|lt|gt|quot|#\d+|#x[0-9a-fA-F]+);/.test(text)) return null
  return { confidence: 0.5, label: 'HTML entities', initialInput: text }
}
