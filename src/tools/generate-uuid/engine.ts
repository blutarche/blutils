/**
 * generate.uuid — pure UUID v4 engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * with an injected, deterministic byte source. The Tool wires the
 * real Web Crypto source (`crypto.getRandomValues`) at the edge.
 *
 * v4 is fully random except for two fixed fields the spec pins:
 * the version nibble (the high nibble of byte 6) is 0b0100, and the
 * variant (the two high bits of byte 8) are 0b10. We overwrite
 * those bits on the supplied bytes per RFC 9562 §5.4 before
 * formatting `8-4-4-4-12` lowercase hex.
 */

/** The all-zero UUID, RFC 9562 §5.9. */
export const NIL_UUID = '00000000-0000-0000-0000-000000000000'

const HEX = '0123456789abcdef'

/** Lowercase hex for one byte, no allocation per call beyond the pair. */
function byteHex(b: number): string {
  return HEX[(b >> 4) & 0xf]! + HEX[b & 0xf]!
}

/**
 * Build a v4 UUID string from 16 random bytes. The version and
 * variant bits are forced on a copy so the caller's buffer is left
 * untouched and the output always satisfies the v4 grammar even
 * when handed all-zero bytes.
 */
export function uuidV4(bytes16: Uint8Array): string {
  if (bytes16.length < 16) {
    throw new Error('uuidV4 requires at least 16 bytes')
  }
  const b = bytes16.slice(0, 16)
  b[6] = (b[6]! & 0x0f) | 0x40 // version 4 in the high nibble of byte 6
  b[8] = (b[8]! & 0x3f) | 0x80 // variant 10x in the two high bits of byte 8

  let hex = ''
  for (let i = 0; i < 16; i++) hex += byteHex(b[i]!)
  return (
    hex.slice(0, 8) +
    '-' +
    hex.slice(8, 12) +
    '-' +
    hex.slice(12, 16) +
    '-' +
    hex.slice(16, 20) +
    '-' +
    hex.slice(20, 32)
  )
}

/**
 * Generate `count` v4 UUIDs. `fill` defaults to the Web Crypto
 * CSPRNG but is injectable for deterministic tests. Each UUID draws
 * its own fresh 16 bytes.
 */
export function randomUuids(
  count: number,
  fill: (a: Uint8Array) => void = (a) => crypto.getRandomValues(a),
): string[] {
  return Array.from({ length: count }, () => {
    const bytes = new Uint8Array(16)
    fill(bytes)
    return uuidV4(bytes)
  })
}
