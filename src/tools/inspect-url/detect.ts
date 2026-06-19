import type { Detector } from '../../types'

/**
 * An absolute http(s) URL on its own. Confidence is kept below the
 * 0.55 threshold the other URL detectors use so this doesn't fight
 * encode.url on overlapping text — a bare URL is more often pasted
 * to encode than to dissect.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (!/^https?:\/\/\S+$/.test(t)) return null
  return { confidence: 0.5, label: 'URL', initialInput: t }
}
