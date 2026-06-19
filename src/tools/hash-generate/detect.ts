import type { Detector } from '../../types'

/**
 * Match common digest shapes by exact hex length. We don't return
 * the input as initialInput because the hash Tool consumes
 * plaintext, not digests — so the strip just opens the Tool empty
 * and lets the user paste/type fresh input. JWT-shaped tokens are
 * detected by inspect.jwt, which routes them to the JWT decoder.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (/^[a-f0-9]{128}$/i.test(t)) return { confidence: 0.95, label: 'SHA-512 hex' }
  if (/^[a-f0-9]{64}$/i.test(t)) return { confidence: 0.95, label: 'SHA-256 hex' }
  if (/^[a-f0-9]{40}$/i.test(t)) return { confidence: 0.9, label: 'SHA-1 hex' }
  if (/^[a-f0-9]{32}$/i.test(t)) return { confidence: 0.85, label: 'MD5 hex' }
  return null
}
