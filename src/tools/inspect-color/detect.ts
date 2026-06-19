import type { Detector } from '../../types'

/**
 * Color candidate: a #rgb / #rrggbb hex literal, or an rgb(/hsl(
 * functional notation. Modest confidence (~0.55) — these shapes are
 * common enough in pasted CSS that we don't want to outrank a more
 * specific Detector on the same text.
 */
export const detect: Detector = (text) => {
  const t = text.trim()
  // Extract the bare color literal rather than seeding the whole
  // string — `color: #fff;` should open the tool on `#fff`, not on a
  // CSS snippet the parser would reject.
  const hex = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/.exec(t)
  const fn = /\b(?:rgb|hsl)a?\([^)]*\)/i.exec(t)
  const match = hex?.[0] ?? fn?.[0]
  if (!match) return null
  return { confidence: 0.55, label: 'color', initialInput: match }
}
