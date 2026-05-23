/**
 * Fuzzy match — substring first, letter-order as fallback.
 *
 * The Palette uses this against every Tool's name, title, id, and
 * tags, and against every Command name. Returning `ranges` lets
 * the result rows highlight which characters matched.
 *
 * Scoring is intentionally two-tier so a query like `js` ranks an
 * exact substring (`json`) above a scattered letter-order hit
 * (`js` in `json-stringify`).
 *
 *   - exact substring  → score = 1000 - position
 *   - letter-order     → score =  500 - ranges.length * 10
 *   - no match         → null
 *
 * Ported verbatim from design/blutils-palette.jsx and typed.
 */

export type Range = readonly [number, number]

export interface FuzzyResult {
  score: number
  ranges: Range[]
}

export function fuzzyMatch(query: string, target: string): FuzzyResult | null {
  if (!query) return { score: 0, ranges: [] }
  const q = query.toLowerCase()
  const t = target.toLowerCase()

  const idx = t.indexOf(q)
  if (idx !== -1) {
    return { score: 1000 - idx, ranges: [[idx, idx + q.length]] }
  }

  const ranges: Array<[number, number]> = []
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      const last = ranges[ranges.length - 1]
      if (last && last[1] === i) last[1] = i + 1
      else ranges.push([i, i + 1])
      qi++
    }
  }
  if (qi < q.length) return null
  return { score: 500 - ranges.length * 10, ranges }
}

export function bestMatch(matches: Array<FuzzyResult | null>): FuzzyResult | null {
  let best: FuzzyResult | null = null
  for (const m of matches) {
    if (!m) continue
    if (!best || m.score > best.score) best = m
  }
  return best
}
