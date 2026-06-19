/**
 * encode.jws — JWT (JWS compact serialization) signer (HMAC).
 *
 * The counterpart to the inspect.jwt *decoder*. Unlike that tool,
 * this one holds the secret and produces a real, verifiable
 * signature — which is fine because the app is local-only and the
 * secret never leaves the browser. The UI makes that explicit.
 *
 * The HMAC runs through SubtleCrypto so we get a native, audited
 * implementation and zero crypto code in our bundle. The base64url
 * plumbing on top is pure and synchronous so it can be unit-tested
 * without touching crypto; `crypto.subtle` exists in both the
 * browser and Node 20, so the async `signJwt` path is exercised by
 * the test suite directly.
 */

export type JwtAlgo = 'HS256' | 'HS384' | 'HS512'

/** Maps a JWS alg name to the SubtleCrypto digest name. */
const HASH_FOR_ALGO: Record<JwtAlgo, 'SHA-256' | 'SHA-384' | 'SHA-512'> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
}

/**
 * Bytes → base64url (no padding, URL-safe alphabet `-_`). Throws if
 * no base64 encoder is available.
 */
export function base64urlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  let b64: string
  if (typeof btoa === 'function') {
    b64 = btoa(binary)
  } else if (typeof Buffer !== 'undefined') {
    b64 = Buffer.from(bytes).toString('base64')
  } else {
    throw new Error('no base64 encoder available')
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** UTF-8 string → base64url (no padding). */
export function base64urlEncodeString(str: string): string {
  return base64urlEncode(new TextEncoder().encode(str))
}

/**
 * Sign a JWT (JWS compact serialization) with HMAC.
 *
 * The header is merged so `alg` matches the requested algorithm and
 * `typ` defaults to `JWT`; the payload is passed through verbatim.
 * Both are base64url-encoded from their JSON (key order follows the
 * object as given — JWS signs exact bytes, not a canonical form),
 * joined into the signing input, and HMAC-signed with `secret` as UTF-8 key
 * bytes. Returns the three-segment compact token.
 */
export async function signJwt(
  headerObj: Record<string, unknown>,
  payloadObj: Record<string, unknown>,
  secret: string,
  algo: JwtAlgo,
): Promise<string> {
  const header = { ...headerObj, alg: algo, typ: headerObj.typ ?? 'JWT' }

  const b64Header = base64urlEncodeString(JSON.stringify(header))
  const b64Payload = base64urlEncodeString(JSON.stringify(payloadObj))
  const signingInput = `${b64Header}.${b64Payload}`

  const keyBytes = new TextEncoder().encode(secret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    // Fresh copy so the type is Uint8Array<ArrayBuffer> (not the
    // ArrayBufferLike default, which isn't a valid BufferSource).
    new Uint8Array(keyBytes),
    { name: 'HMAC', hash: HASH_FOR_ALGO[algo] },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new Uint8Array(new TextEncoder().encode(signingInput)),
  )
  const b64Sig = base64urlEncode(new Uint8Array(sig))

  return `${signingInput}.${b64Sig}`
}
