/**
 * encode.hex — pure text ↔ hex engine plus a classic hexdump.
 *
 * Dependency-free and DOM-free so the byte-level logic can be unit
 * tested in isolation; the Tool.tsx wires these to its UI at the
 * edge. UTF-8 is the canonical encoding both ways via TextEncoder /
 * TextDecoder, so emoji and CJK round-trip cleanly. Input is treated
 * as well-formed Unicode text; an unpaired surrogate (already an
 * invalid JS string) is normalized to U+FFFD by UTF-8 encoding and so
 * will not round-trip — that is the encoder's behavior, not a claim of
 * lossless UTF-16 transport.
 */

export interface HexOptions {
  /** Emit A-F instead of a-f. Default false. */
  upper?: boolean
  /** String placed between byte pairs, e.g. ' '. Default ''. */
  delimiter?: string
}

/** UTF-8 encode `text`, then render each byte as a two-digit hex pair. */
export function textToHex(text: string, opts: HexOptions = {}): string {
  const { upper = false, delimiter = '' } = opts
  const bytes = new TextEncoder().encode(text)
  const pairs: string[] = []
  for (const b of bytes) {
    const pair = b.toString(16).padStart(2, '0')
    pairs.push(upper ? pair.toUpperCase() : pair)
  }
  return pairs.join(delimiter)
}

/**
 * Parse a hex string back to UTF-8 text. Whitespace (spaces, tabs,
 * newlines) between or around pairs is tolerated; everything else
 * must be an even-length run of hex digits. Throws on odd length or
 * a non-hex character, and on bytes that aren't valid UTF-8.
 */
export function hexToText(hex: string): string {
  const cleaned = hex.replace(/\s+/g, '')
  if (cleaned.length === 0) return ''
  if (cleaned.length % 2 !== 0) {
    throw new Error('hex must have an even number of digits')
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('hex contains a non-hex character')
  }
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

/**
 * Classic hexdump of `text`'s UTF-8 bytes: 16 bytes per row, an
 * 8-digit hex offset, space-separated byte pairs, and an ASCII
 * gutter where bytes outside the printable range (0x20–0x7e) show
 * as `.`. Short final rows are padded so the gutter stays aligned.
 */
export function hexdump(text: string): string {
  const bytes = new TextEncoder().encode(text)
  if (bytes.length === 0) return ''
  const rows: string[] = []
  for (let off = 0; off < bytes.length; off += 16) {
    const slice = bytes.slice(off, off + 16)
    const offset = off.toString(16).padStart(8, '0')
    const hexCells: string[] = []
    let ascii = ''
    for (let i = 0; i < 16; i++) {
      const b = slice[i]
      if (b === undefined) {
        hexCells.push('  ')
      } else {
        hexCells.push(b.toString(16).padStart(2, '0'))
        ascii += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'
      }
    }
    rows.push(`${offset}  ${hexCells.join(' ')}  |${ascii}|`)
  }
  return rows.join('\n')
}
