import type { Detector } from '../../types'

/**
 * Match content that looks markdown-shaped. Two cheap signals:
 *
 *   - an ATX heading on any line (# / ## / … / ######)
 *   - a top-level list marker (- / * / + at line start)
 *
 * Confidence is deliberately low — prose with "* note" or a
 * conversation that uses # for some other purpose will trip
 * the regex. The strip is a suggestion, not a verdict.
 */
export const detect: Detector = (text) => {
  if (text.length < 4) return null
  if (/^#{1,6}\s/m.test(text) || /^[-*+]\s/m.test(text)) {
    return { confidence: 0.55, label: 'looks like markdown', initialInput: text }
  }
  return null
}
