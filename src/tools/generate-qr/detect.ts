import type { Detector } from '../../types'

/**
 * Match an http(s) URL. Common case: the user has a link on the
 * clipboard and wants a QR for it.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (!/^https?:\/\/\S+$/i.test(t)) return null
  if (t.length > 2000) return null
  return { confidence: 0.8, label: 'URL — encode as QR?', initialInput: t }
}
