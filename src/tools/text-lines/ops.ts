/**
 * Composable Ops contributed by text.lines.
 *
 * Only the operations with a single canonical, deterministic form
 * are exposed as Chain Ops. Sort defaults to case-sensitive
 * ascending (locale, numeric-aware); the case-insensitive toggle
 * lives in the Tool UI rather than as a separate Op.
 */

import type { Op } from '../../types'
import {
  dedupe,
  removeBlankLines,
  reverseLines,
  sortAsc,
  sortDesc,
  trimLines,
} from './engine'

export const ops: Op[] = [
  { id: 'lines.sort', label: 'sort lines', icon: 'List', fn: (s) => sortAsc(s) },
  { id: 'lines.sort-desc', label: 'sort lines (desc)', icon: 'List', fn: (s) => sortDesc(s) },
  { id: 'lines.dedupe', label: 'dedupe lines', icon: 'List', fn: (s) => dedupe(s) },
  { id: 'lines.reverse', label: 'reverse lines', icon: 'List', fn: (s) => reverseLines(s) },
  { id: 'lines.trim', label: 'trim lines', icon: 'List', fn: (s) => trimLines(s) },
  { id: 'lines.remove-blank', label: 'remove blank lines', icon: 'List', fn: (s) => removeBlankLines(s) },
]
