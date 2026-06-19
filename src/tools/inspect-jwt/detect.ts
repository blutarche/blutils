import type { Detector } from '../../types'

/**
 * Match a compact-serialized JWT: three base64url segments where
 * the first two are JSON objects (so they begin with the encoded
 * `{"` → `eyJ`). The signature segment may be empty (alg: none).
 * High confidence so JWTs route here rather than to hash.generate
 * on shape alone — we seed the Tool with the token.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  if (!/^eyJ[\w-]+\.eyJ[\w-]+\.[\w-]*$/.test(t)) return null
  return { confidence: 0.95, label: 'JWT', initialInput: t }
}
