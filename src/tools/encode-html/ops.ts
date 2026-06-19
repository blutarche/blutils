/**
 * Composable Ops contributed by the HTML-entity codec.
 *
 * encode wraps the basic-five escape (the Tool UI exposes the
 * non-ASCII numeric toggle); decode handles the named + numeric set.
 * Both are pure and DOM-free via ./engine.
 */

import type { Op } from '../../types'
import { decode, encode } from './engine'

export const ops: Op[] = [
  {
    id: 'html.encode',
    label: 'html encode',
    icon: 'Code',
    fn(input) {
      return encode(input)
    },
  },
  {
    id: 'html.decode',
    label: 'html decode',
    icon: 'Code',
    fn(input) {
      return decode(input)
    },
  },
]
