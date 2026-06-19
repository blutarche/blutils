import type { Detector } from '../../types'

/**
 * Hex-bytes candidate: an even-length run of hex digit pairs,
 * optionally space-separated, at least 8 chars long. Confidence is
 * kept below the base64 detector (0.7) since base64's alphabet is a
 * superset of hex and that codec is the more common intent.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (t.length < 8) return null
  const cleaned = t.replace(/\s+/g, '')
  if (cleaned.length % 2 !== 0) return null
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null
  return { confidence: 0.45, label: 'hex bytes', initialInput: t }
}
