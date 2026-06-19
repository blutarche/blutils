/**
 * Composable Ops contributed by the base converter.
 *
 * Chain Ops are string-in / string-out, so each op parses its input
 * in the source base and re-renders it in the target base. Decimal ↔
 * hexadecimal are the two everyday conversions; both run through the
 * BigInt engine so large values survive the pipeline intact.
 */

import type { Op } from '../../types'
import { parseInBase, toBase } from './engine'

export const ops: Op[] = [
  {
    id: 'base.dec2hex',
    label: 'dec → hex',
    icon: 'Binary',
    fn(input) {
      return toBase(parseInBase(input, 10), 16)
    },
  },
  {
    id: 'base.hex2dec',
    label: 'hex → dec',
    icon: 'Binary',
    fn(input) {
      return toBase(parseInBase(input, 16), 10)
    },
  },
]
