import type { Detector } from '../../types'

/**
 * Match valid JSON — the only thing that survives JSON.parse and
 * starts with the right bracket. Highest confidence because
 * JSON.parse is unforgiving.
 */
export const detect: Detector = (text) => {
  if (text.length < 2) return null
  const t = text.trim()
  if (!((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']')))) {
    return null
  }
  try {
    JSON.parse(t)
  } catch {
    return null
  }
  return { confidence: 1, label: 'JSON object detected', initialInput: t }
}
