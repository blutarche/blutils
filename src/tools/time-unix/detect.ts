import type { Detector } from '../../types'

/**
 * Match 10- or 13-digit integers that fall inside a plausible
 * present-day Unix timestamp window. The 1[6-9] / 1[6-9]…
 * prefixes cover 2020-2030-ish in seconds and milliseconds —
 * tight enough that random 10-digit IDs don't trip the strip.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (/^1[6-9]\d{8}$/.test(t)) {
    return { confidence: 0.72, label: 'unix timestamp (sec)' }
  }
  if (/^1[6-9]\d{11}$/.test(t)) {
    return { confidence: 0.75, label: 'unix timestamp (ms)' }
  }
  return null
}
