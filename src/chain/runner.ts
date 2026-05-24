/**
 * Sequential Chain runner.
 *
 * The runner takes the input string (from the first step) and a
 * list of Op steps, then pipes each output into the next input.
 * The chain halts at the first thrown error: subsequent steps
 * report `pending: true` so the UI can render them dimmed.
 *
 * `cancelled` lets callers abort a stale run when state changes
 * mid-flight (every input edit kicks off a fresh run).
 */

import type { Op } from '../types'

export interface ChainStepResult {
  ok: boolean
  value?: string
  error?: string
  /** True for steps that didn't run because an earlier step failed. */
  pending?: boolean
}

export async function runChain(
  input: string,
  steps: Op[],
  isCancelled: () => boolean = () => false,
): Promise<ChainStepResult[]> {
  const out: ChainStepResult[] = []
  let current = input
  let halted = false

  for (const op of steps) {
    if (halted) {
      out.push({ ok: false, pending: true })
      continue
    }
    try {
      current = await op.fn(current)
      if (isCancelled()) return out
      out.push({ ok: true, value: current })
    } catch (err) {
      halted = true
      out.push({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return out
}
