/**
 * Composable Ops contributed by the hex codec.
 *
 * UTF-8 round-trip via the shared engine so non-ASCII text survives
 * in either direction. Encoding is lowercase, undelimited — the
 * canonical hex form; the Tool UI owns the cosmetic toggles.
 */

import type { Op } from '../../types'
import { hexToText, textToHex } from './engine'

export const ops: Op[] = [
  {
    id: 'hex.encode',
    label: 'hex encode',
    icon: 'FileDigit',
    fn: (input) => textToHex(input),
  },
  {
    id: 'hex.decode',
    label: 'hex decode',
    icon: 'FileDigit',
    fn: (input) => hexToText(input),
  },
]
