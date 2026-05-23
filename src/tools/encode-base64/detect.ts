import type { Detector } from '../../types'

/**
 * Base64 candidate: only A-Z / a-z / 0-9 / +/=/-/_ and a length
 * that's a multiple of 4 (or close, when padding has been stripped
 * URL-safe-style). Demands at least 16 chars so we don't match
 * common short identifiers.
 *
 * Skipped when the string looks like one of the digest shapes
 * (hash.generate handles those with a higher confidence anyway).
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (t.length < 16) return null
  if (!/^[A-Za-z0-9+/=\-_]+$/.test(t)) return null
  // Don't pre-empt hash.generate on hex digest lengths.
  if (/^[a-f0-9]+$/i.test(t) && (t.length === 32 || t.length === 40 || t.length === 64 || t.length === 128)) {
    return null
  }
  const padded = t.replace(/-/g, '+').replace(/_/g, '/')
  const mod = padded.length % 4
  // Tolerate URL-safe stripped padding (mod 2 or 3); reject mod 1.
  if (mod === 1) return null
  return { confidence: 0.7, label: 'base64 payload', initialInput: t }
}
