/**
 * inspect.url — pure URL component parser.
 *
 * Wraps the platform `URL` so the Tool gets a flat, copyable record
 * of every component without re-deriving the WHATWG parse rules by
 * hand. Side-effect-free and dependency-free, so the whole shape is
 * unit-testable.
 *
 * `params` is taken from `searchParams.entries()`, which yields
 * decoded key/value pairs in document order and preserves duplicate
 * keys (e.g. `?x=1&x=3` → two `x` rows) — a plain object would
 * collapse them, so a [key, value][] is used instead.
 */

export interface ParsedUrl {
  protocol: string
  username: string
  password: string
  host: string
  hostname: string
  port: string
  origin: string
  pathname: string
  search: string
  hash: string
  /** Decoded query pairs in order; duplicate keys are kept. */
  params: [string, string][]
}

/**
 * Parse `input` into its URL components. Throws a clear Error when
 * the input is not an absolute URL (the platform `URL` constructor
 * throws a terse TypeError, which we replace).
 */
export function parseUrl(input: string): ParsedUrl {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('Enter a URL to parse')

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error('Invalid URL — expected an absolute URL like https://example.com/path')
  }

  const params: [string, string][] = []
  for (const [key, value] of url.searchParams.entries()) {
    params.push([key, value])
  }

  return {
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    params,
  }
}
