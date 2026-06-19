/**
 * Composable Ops contributed by the URL codec.
 *
 * These wrap the "component" variant (encodeURIComponent /
 * decodeURIComponent) — the safe default for embedding a value in a
 * single query parameter or path segment. The Tool UI exposes the
 * full-URI variant; chain Ops stay on the canonical component form.
 *
 * decode here is intentionally a thin wrapper that lets URIError
 * propagate, so the Chain runner reports a malformed payload like
 * any other failing step.
 */

import type { Op } from '../../types'

export const ops: Op[] = [
  {
    id: 'url.encode',
    label: 'url encode',
    icon: 'Link',
    fn(input) {
      return encodeURIComponent(input)
    },
  },
  {
    id: 'url.decode',
    label: 'url decode',
    icon: 'Link',
    fn(input) {
      return decodeURIComponent(input)
    },
  },
]
