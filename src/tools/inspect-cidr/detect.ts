import type { Detector } from '../../types'

/**
 * Match dotted-quad IPv4, with or without a /prefix. The octet
 * shape is loose on purpose — the Tool's engine does the strict
 * 0-255 / 0-32 validation; the strip only needs a plausible hit
 * to offer the calculator.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  const m = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/.exec(t)
  if (!m) return null
  return {
    confidence: 0.6,
    label: 'IPv4 address/CIDR',
    initialInput: t,
  }
}
