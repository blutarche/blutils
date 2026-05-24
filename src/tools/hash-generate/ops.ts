/**
 * Hash Ops contributed to the Chain.
 *
 * SHA family goes through SubtleCrypto; MD5 reuses the hand-rolled
 * implementation alongside this file. Output is lowercase hex,
 * matching the Tool's default chip-copy format.
 */

import type { Op } from '../../types'
import { md5 } from './md5'

async function subtleHex(algo: 'SHA-1' | 'SHA-256' | 'SHA-512', input: string): Promise<string> {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const ops: Op[] = [
  { id: 'hash.md5', label: 'md5', icon: 'Hash', fn: (s) => md5(s) },
  { id: 'hash.sha1', label: 'sha-1', icon: 'Hash', fn: (s) => subtleHex('SHA-1', s) },
  { id: 'hash.sha256', label: 'sha-256', icon: 'Hash', fn: (s) => subtleHex('SHA-256', s) },
  { id: 'hash.sha512', label: 'sha-512', icon: 'Hash', fn: (s) => subtleHex('SHA-512', s) },
]
