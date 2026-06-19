/**
 * Composable Ops contributed by the Base32 / Base58 codec.
 *
 * Small, pure, and dependency-free, so they're bundled here rather
 * than split into engine.ts. All four go through TextEncoder /
 * TextDecoder, so non-ASCII text survives a round-trip in either
 * direction. These mirror the Tool's standard alphabets — Base32 is
 * RFC 4648, Base58 is the Bitcoin alphabet.
 */

import type { Op } from '../../types'
import {
  base32Decode,
  base32Encode,
  base58Decode,
  base58Encode,
} from './engine'

export const ops: Op[] = [
  {
    id: 'base32.encode',
    label: 'base32 encode',
    icon: 'Binary',
    fn: (input) => base32Encode(input),
  },
  {
    id: 'base32.decode',
    label: 'base32 decode',
    icon: 'Binary',
    fn: (input) => base32Decode(input),
  },
  {
    id: 'base58.encode',
    label: 'base58 encode',
    icon: 'Binary',
    fn: (input) => base58Encode(input),
  },
  {
    id: 'base58.decode',
    label: 'base58 decode',
    icon: 'Binary',
    fn: (input) => base58Decode(input),
  },
]
