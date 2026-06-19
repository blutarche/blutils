import type { Detector } from '../../types'

/**
 * Prefixed-integer candidate: a hex (`0x…`) or binary (`0b…`)
 * literal. Modest confidence (~0.5) — these shapes also read as
 * plain identifiers in some contexts, so we don't want to pre-empt
 * a more specific Detector.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (!/^0x[0-9a-fA-F]+$/.test(t) && !/^0b[01]+$/.test(t)) return null
  return { confidence: 0.5, label: 'based integer', initialInput: t }
}
