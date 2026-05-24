/**
 * Composable Ops contributed by the base64 codec.
 *
 * UTF-8 round-trip via TextEncoder/TextDecoder so non-ASCII text
 * survives in either direction. URL-safe variant is intentionally
 * left to the Tool UI — chain Ops are the canonical encoding.
 */

import type { Op } from '../../types'

export const ops: Op[] = [
  {
    id: 'b64.encode',
    label: 'base64 encode',
    icon: 'Binary',
    fn(input) {
      const bytes = new TextEncoder().encode(input)
      let bin = ''
      for (const b of bytes) bin += String.fromCharCode(b)
      return btoa(bin)
    },
  },
  {
    id: 'b64.decode',
    label: 'base64 decode',
    icon: 'Binary',
    fn(input) {
      const bin = atob(input.trim())
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return new TextDecoder().decode(bytes)
    },
  },
]
