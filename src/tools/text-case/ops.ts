/**
 * Composable Ops contributed by the case converter.
 *
 * One deterministic Op per case, generated from the shared `CASES`
 * registry so the Chain steps stay in lockstep with the Tool UI.
 */

import type { Op } from '../../types'
import { CASES } from './engine'

export const ops: Op[] = CASES.map((c) => ({
  id: `case.${c.key}`,
  label: c.label,
  icon: 'CaseSensitive',
  fn: c.fn,
}))
