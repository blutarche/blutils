import type { Detector } from '../../types'

/**
 * Match a 5-field cron expression. Each field is a non-empty run
 * of digits, *, /, -, or commas. We require five fields separated
 * by whitespace — restrictive enough that random text doesn't
 * match. Confidence is high because the shape is so specific.
 */
const FIELD = /^[\d*/,\-]+$/

export const detect: Detector = (text) => {
  const t = text.trim()
  if (t.length > 80) return null
  const parts = t.split(/\s+/)
  if (parts.length !== 5) return null
  if (!parts.every((p) => FIELD.test(p))) return null
  return { confidence: 0.88, label: 'cron expression', initialInput: t }
}
