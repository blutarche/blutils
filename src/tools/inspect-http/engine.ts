/**
 * inspect.http — HTTP status code reference engine.
 *
 * A static lookup table over the standard 1xx–5xx status codes, plus
 * pure helpers for resolving a single code, naming its class, and
 * searching by code prefix or free text. No I/O, no side effects —
 * the whole module is unit-tested directly. It is lazy-loaded with
 * the Tool, so shipping the table here costs nothing on cold load.
 */

export interface StatusCode {
  /** Numeric status, e.g. 404. */
  code: number
  /** Canonical reason phrase, e.g. "Not Found". */
  message: string
  /** One-line plain-language meaning. */
  description: string
}

/** Coarse class label keyed by the leading digit of the code. */
export type StatusClass =
  | 'Informational'
  | 'Success'
  | 'Redirection'
  | 'Client Error'
  | 'Server Error'

/**
 * The reference table. Ordered by code so callers can render it
 * top-to-bottom without re-sorting. Covers the registered status
 * codes a developer is likely to meet in the wild.
 */
export const STATUS_CODES: readonly StatusCode[] = [
  // 1xx — Informational
  { code: 100, message: 'Continue', description: 'The server received the request headers and the client should proceed to send the request body.' },
  { code: 101, message: 'Switching Protocols', description: 'The server is switching protocols as requested by the client via the Upgrade header.' },
  { code: 102, message: 'Processing', description: 'The server has accepted the request but has not yet completed it (WebDAV).' },
  { code: 103, message: 'Early Hints', description: 'Returns some response headers before the final response, letting the client preload resources.' },

  // 2xx — Success
  { code: 200, message: 'OK', description: 'The request succeeded. The meaning of success depends on the HTTP method.' },
  { code: 201, message: 'Created', description: 'The request succeeded and a new resource was created as a result.' },
  { code: 202, message: 'Accepted', description: 'The request was received but not yet acted upon; processing happens later.' },
  { code: 203, message: 'Non-Authoritative Information', description: 'The returned metadata is from a local or third-party copy rather than the origin server.' },
  { code: 204, message: 'No Content', description: 'The request succeeded but there is no content to send in the response body.' },
  { code: 205, message: 'Reset Content', description: 'The request succeeded; the client should reset the document view that sent the request.' },
  { code: 206, message: 'Partial Content', description: 'The server is delivering only part of the resource in response to a Range header.' },
  { code: 207, message: 'Multi-Status', description: 'Conveys information about multiple resources where several status codes apply (WebDAV).' },

  // 3xx — Redirection
  { code: 300, message: 'Multiple Choices', description: 'The request has more than one possible response; the client should choose one.' },
  { code: 301, message: 'Moved Permanently', description: 'The resource has a new permanent URL, given in the Location header.' },
  { code: 302, message: 'Found', description: 'The resource resides temporarily under a different URL given by the Location header.' },
  { code: 303, message: 'See Other', description: 'The client should fetch the resource at another URL using a GET request.' },
  { code: 304, message: 'Not Modified', description: 'The cached copy is still valid; the resource has not changed since the last request.' },
  { code: 307, message: 'Temporary Redirect', description: 'The resource is temporarily at another URL; the request method must not change.' },
  { code: 308, message: 'Permanent Redirect', description: 'The resource is permanently at another URL; the request method must not change.' },

  // 4xx — Client Error
  { code: 400, message: 'Bad Request', description: 'The server cannot process the request due to a client error such as malformed syntax.' },
  { code: 401, message: 'Unauthorized', description: 'Authentication is required and has failed or has not been provided.' },
  { code: 402, message: 'Payment Required', description: 'Reserved for future use; sometimes used by APIs to signal a payment or quota issue.' },
  { code: 403, message: 'Forbidden', description: 'The server understood the request but refuses to authorize it.' },
  { code: 404, message: 'Not Found', description: 'The server cannot find the requested resource.' },
  { code: 405, message: 'Method Not Allowed', description: 'The request method is known but not supported for the target resource.' },
  { code: 406, message: 'Not Acceptable', description: 'The resource cannot produce a response matching the request Accept headers.' },
  { code: 407, message: 'Proxy Authentication Required', description: 'The client must first authenticate itself with the proxy.' },
  { code: 408, message: 'Request Timeout', description: 'The server timed out waiting for the request from the client.' },
  { code: 409, message: 'Conflict', description: 'The request conflicts with the current state of the target resource.' },
  { code: 410, message: 'Gone', description: 'The resource is permanently gone and no forwarding address is known.' },
  { code: 411, message: 'Length Required', description: 'The server requires a Content-Length header, which the request did not include.' },
  { code: 412, message: 'Precondition Failed', description: 'A precondition given in the request headers evaluated to false on the server.' },
  { code: 413, message: 'Content Too Large', description: 'The request body is larger than the server is willing or able to process (formerly "Payload Too Large").' },
  { code: 414, message: 'URI Too Long', description: 'The requested URI is longer than the server is willing to interpret.' },
  { code: 415, message: 'Unsupported Media Type', description: 'The request payload is in a format the server does not support.' },
  { code: 416, message: 'Range Not Satisfiable', description: 'The Range header requests a portion the server cannot supply.' },
  { code: 417, message: 'Expectation Failed', description: 'The expectation given in the Expect request header could not be met.' },
  { code: 418, message: "I'm a teapot", description: 'The server refuses to brew coffee because it is, permanently, a teapot (RFC 2324). Reserved/unused in RFC 9110.' },
  { code: 421, message: 'Misdirected Request', description: 'The request was directed at a server unable to produce a response for it.' },
  { code: 422, message: 'Unprocessable Content', description: 'The request was well-formed but had semantic errors (formerly "Unprocessable Entity").' },
  { code: 423, message: 'Locked', description: 'The resource being accessed is locked (WebDAV).' },
  { code: 424, message: 'Failed Dependency', description: 'The request failed because it depended on another request that failed (WebDAV).' },
  { code: 425, message: 'Too Early', description: 'The server is unwilling to process a request that might be replayed.' },
  { code: 426, message: 'Upgrade Required', description: 'The client should switch to a different protocol given in the Upgrade header.' },
  { code: 428, message: 'Precondition Required', description: 'The origin server requires the request to be conditional.' },
  { code: 429, message: 'Too Many Requests', description: 'The client has sent too many requests in a given amount of time (rate limiting).' },
  { code: 431, message: 'Request Header Fields Too Large', description: 'The request was refused because its header fields are too large.' },
  { code: 451, message: 'Unavailable For Legal Reasons', description: 'The resource is unavailable for legal reasons, such as censorship or a takedown.' },

  // 5xx — Server Error
  { code: 500, message: 'Internal Server Error', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.' },
  { code: 501, message: 'Not Implemented', description: 'The server does not support the functionality required to fulfill the request.' },
  { code: 502, message: 'Bad Gateway', description: 'The server, acting as a gateway, received an invalid response from the upstream server.' },
  { code: 503, message: 'Service Unavailable', description: 'The server is not ready to handle the request, often due to overload or maintenance.' },
  { code: 504, message: 'Gateway Timeout', description: 'The server, acting as a gateway, did not receive a timely response from the upstream server.' },
  { code: 505, message: 'HTTP Version Not Supported', description: 'The server does not support the HTTP version used in the request.' },
  { code: 506, message: 'Variant Also Negotiates', description: 'A content-negotiation configuration error: the chosen variant is itself a negotiation endpoint.' },
  { code: 507, message: 'Insufficient Storage', description: 'The server cannot store the representation needed to complete the request (WebDAV).' },
  { code: 508, message: 'Loop Detected', description: 'The server terminated the request because it encountered an infinite loop (WebDAV).' },
  { code: 510, message: 'Not Extended', description: 'Further extensions to the request are required for the server to fulfill it.' },
  { code: 511, message: 'Network Authentication Required', description: 'The client must authenticate to gain network access, typically at a captive portal.' },
]

const byCode = new Map<number, StatusCode>(STATUS_CODES.map((s) => [s.code, s]))

const CLASS_LABELS: Record<number, StatusClass> = {
  1: 'Informational',
  2: 'Success',
  3: 'Redirection',
  4: 'Client Error',
  5: 'Server Error',
}

/** Resolve a single status code, or undefined if it is not in the table. */
export function lookup(code: number): StatusCode | undefined {
  return byCode.get(code)
}

/**
 * The class label for a code, derived from its leading digit.
 * Returns undefined for codes outside the 100–599 range.
 */
export function classOf(code: number): StatusClass | undefined {
  return CLASS_LABELS[Math.floor(code / 100)]
}

/**
 * Search the table. An all-digit query matches by code prefix (so
 * "40" returns 400, 404, …); any other query matches the reason
 * phrase or description, case-insensitively. A blank query returns
 * the whole table.
 */
export function search(query: string): StatusCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...STATUS_CODES]
  if (/^\d+$/.test(q)) {
    return STATUS_CODES.filter((s) => String(s.code).startsWith(q))
  }
  return STATUS_CODES.filter(
    (s) =>
      s.message.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  )
}
