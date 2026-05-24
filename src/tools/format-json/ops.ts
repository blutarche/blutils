/**
 * Composable Ops contributed by the JSON formatter.
 *
 * The Chain runner discovers these via the eager `ops.ts` glob.
 * Each Op takes a string and returns a string; throwing surfaces
 * as a step error in the chain UI.
 */

import type { Op } from '../../types'

export const ops: Op[] = [
  {
    id: 'json.format',
    label: 'json format',
    icon: 'Braces',
    fn(input) {
      return JSON.stringify(JSON.parse(input), null, 2)
    },
  },
  {
    id: 'json.minify',
    label: 'json minify',
    icon: 'Braces',
    fn(input) {
      return JSON.stringify(JSON.parse(input))
    },
  },
]
