/**
 * Composable Op contributed by the slugify Tool.
 *
 * Canonical defaults (hyphen separator, lowercased). Separator and
 * casing toggles are intentionally left to the Tool UI — the chain
 * Op is the one-true slug.
 */

import type { Op } from '../../types'
import { slugify } from './engine'

export const ops: Op[] = [
  {
    id: 'text.slugify',
    label: 'slugify',
    icon: 'Link2',
    fn: (input) => slugify(input),
  },
]
