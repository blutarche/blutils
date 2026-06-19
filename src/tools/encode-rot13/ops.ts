/**
 * Composable Op contributed by the ROT13 / Caesar codec.
 *
 * ROT13 is deterministic and self-inverse, which makes it a clean
 * Chain step — applying it twice returns the original text. The
 * parametric Caesar shift stays in the Tool UI; the canonical Op is
 * the fixed-13 rotation.
 */

import type { Op } from '../../types'
import { rot13 } from './engine'

export const ops: Op[] = [
  {
    id: 'rot13',
    label: 'rot13',
    icon: 'RotateCw',
    fn: (input) => rot13(input),
  },
]
