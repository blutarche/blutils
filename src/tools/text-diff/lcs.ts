/**
 * Line-based Longest Common Subsequence diff.
 *
 * Reduces two arrays of lines into a sequence of `=` (unchanged),
 * `-` (removed from A), `+` (added in B) operations. The DP table
 * is Uint16Array for memory tightness; we cap m*n at 250 000 so a
 * 5 000-line × 50-line worst case (50 K matches the cap) stays
 * responsive on the main thread.
 *
 * Beyond the cap we return null and the Tool falls back to a
 * dumb side-by-side render — algorithmic completeness shouldn't
 * trade against UI snappiness for the rare megaline diff.
 */

export type DiffOp =
  | { t: '='; a: string; b: string; ai: number; bi: number }
  | { t: '-'; a: string; ai: number }
  | { t: '+'; b: string; bi: number }

export const DIFF_CAP = 250_000

export function lcsDiff(a: string[], b: string[]): DiffOp[] | null {
  const m = a.length
  const n = b.length
  if (m * n > DIFF_CAP) return null

  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i]![j] =
        a[i] === b[j]
          ? dp[i + 1]![j + 1]! + 1
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
    }
  }

  const out: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ t: '=', a: a[i]!, b: b[j]!, ai: i, bi: j })
      i++
      j++
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      out.push({ t: '-', a: a[i]!, ai: i })
      i++
    } else {
      out.push({ t: '+', b: b[j]!, bi: j })
      j++
    }
  }
  while (i < m) {
    out.push({ t: '-', a: a[i]!, ai: i })
    i++
  }
  while (j < n) {
    out.push({ t: '+', b: b[j]!, bi: j })
    j++
  }
  return out
}
