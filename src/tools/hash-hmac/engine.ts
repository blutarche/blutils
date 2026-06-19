/**
 * hash.hmac — keyed-hash (HMAC) engine.
 *
 * The HMAC itself runs through SubtleCrypto so we get a native,
 * audited implementation and zero crypto code in our bundle. What
 * lives here on top of that is the byte ↔ string plumbing: a key
 * may arrive as UTF-8 text, hex, or base64, and the digest may be
 * rendered as hex or base64. Those small encoders are pure and
 * synchronous so they can be unit-tested without touching crypto.
 *
 * `crypto.subtle` exists both in the browser and in Node 20, so
 * the async `hmac` path is exercised by the test suite directly.
 */

export type HmacAlgo = 'SHA-256' | 'SHA-384' | 'SHA-512'
export type KeyEncoding = 'utf-8' | 'hex' | 'base64'
export type OutputEncoding = 'hex' | 'base64'

/** Lowercase-hex string → bytes. Throws on malformed input. */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim()
  if (clean.length % 2 !== 0) {
    throw new Error('hex string must have an even length')
  }
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = clean.slice(i * 2, i * 2 + 2)
    if (!/^[0-9a-fA-F]{2}$/.test(byte)) {
      throw new Error(`invalid hex byte: "${byte}"`)
    }
    out[i] = parseInt(byte, 16)
  }
  return out
}

/** Bytes → lowercase hex. */
export function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (const b of bytes) out += b.toString(16).padStart(2, '0')
  return out
}

/** Bytes → standard (padded) base64. Throws if no encoder is available. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  if (typeof btoa === 'function') return btoa(binary)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  throw new Error('no base64 encoder available')
}

/** Standard base64 → bytes. Throws on malformed input. */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.trim()
  if (typeof atob === 'function') {
    let binary: string
    try {
      binary = atob(clean)
    } catch {
      throw new Error('invalid base64 string')
    }
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
    return out
  }
  if (typeof Buffer !== 'undefined') {
    // Buffer.from is lenient; round-trip to reject malformed input.
    const buf = Buffer.from(clean, 'base64')
    if (buf.toString('base64').replace(/=+$/, '') !== clean.replace(/=+$/, '')) {
      throw new Error('invalid base64 string')
    }
    return new Uint8Array(buf)
  }
  throw new Error('no base64 decoder available')
}

/** Decode the key string into bytes per the chosen encoding. */
function decodeKey(key: string, encoding: KeyEncoding): Uint8Array {
  switch (encoding) {
    case 'hex':
      return hexToBytes(key)
    case 'base64':
      return base64ToBytes(key)
    case 'utf-8':
      return new TextEncoder().encode(key)
  }
}

/**
 * Compute HMAC of `message` (UTF-8) under `key` (decoded per
 * `keyEncoding`, default utf-8) using `algo`, returning the tag as
 * lowercase hex (default) or base64.
 */
export async function hmac(
  message: string,
  key: string,
  algo: HmacAlgo,
  opts: { keyEncoding?: KeyEncoding; output?: OutputEncoding } = {},
): Promise<string> {
  const keyEncoding = opts.keyEncoding ?? 'utf-8'
  const output = opts.output ?? 'hex'

  const keyBytes = decodeKey(key, keyEncoding)
  const msgBytes = new TextEncoder().encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    // Fresh copy so the type is Uint8Array<ArrayBuffer> (not the
    // ArrayBufferLike default, which includes SharedArrayBuffer and
    // isn't a valid BufferSource for importKey).
    new Uint8Array(keyBytes),
    { name: 'HMAC', hash: algo },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes)
  const bytes = new Uint8Array(sig)

  return output === 'base64' ? bytesToBase64(bytes) : bytesToHex(bytes)
}
