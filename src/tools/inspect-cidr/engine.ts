/**
 * inspect.cidr — pure IPv4 subnet (CIDR) engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * directly. All address arithmetic is done on unsigned 32-bit
 * integers: JavaScript's bitwise operators coerce to *signed*
 * int32, so every result is run back through `>>> 0` to land in
 * the [0, 2³²) range a dotted IPv4 address actually lives in.
 *
 * The Tool wires `parseCidr` at the edge and renders the returned
 * record; invalid input throws and the UI catches it for the bad
 * chip.
 */

const TWO_32 = 0x100000000

export interface CidrResult {
  /** Echoed prefix length, 0-32. */
  prefix: number
  /** Network (base) address, dotted. */
  network: string
  /** Broadcast address, dotted. */
  broadcast: string
  /** Subnet mask, dotted (e.g. 255.255.255.0). */
  netmask: string
  /** Inverse of the netmask, dotted (e.g. 0.0.0.255). */
  wildcard: string
  /** First usable host address, dotted (or '—' when none). */
  firstHost: string
  /** Last usable host address, dotted (or '—' when none). */
  lastHost: string
  /** Total addresses in the block, 2^(32-prefix). */
  totalAddresses: number
  /** Usable hosts: max(0, total-2), special-cased for /31 and /32. */
  usableHosts: number
  /** Whether the network address falls in an RFC 1918 private range. */
  isPrivate: boolean
}

/** Dotted IPv4 string → unsigned 32-bit integer. Throws on bad input. */
export function ipToInt(ip: string): number {
  const parts = ip.split('.')
  if (parts.length !== 4) {
    throw new Error(`invalid IPv4 address: ${ip}`)
  }
  let acc = 0
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      throw new Error(`invalid IPv4 octet: ${part}`)
    }
    const n = Number(part)
    if (n > 255) {
      throw new Error(`octet out of range (0-255): ${part}`)
    }
    acc = (acc * 256 + n) >>> 0
  }
  return acc >>> 0
}

/** Unsigned 32-bit integer → dotted IPv4 string. */
export function intToIp(int: number): string {
  const n = int >>> 0
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(
    '.',
  )
}

/** RFC 1918 private ranges plus loopback / link-local, by network int. */
function isPrivateInt(int: number): boolean {
  const n = int >>> 0
  const inRange = (cidr: string): boolean => {
    const [base, bits] = cidr.split('/') as [string, string]
    const prefix = Number(bits)
    const mask = maskForPrefix(prefix)
    return ((n & mask) >>> 0) === ((ipToInt(base) & mask) >>> 0)
  }
  return (
    inRange('10.0.0.0/8') ||
    inRange('172.16.0.0/12') ||
    inRange('192.168.0.0/16') ||
    inRange('127.0.0.0/8') ||
    inRange('169.254.0.0/16')
  )
}

/** Subnet mask integer for a prefix length 0-32. */
function maskForPrefix(prefix: number): number {
  // A 0-prefix mask is 0; otherwise shift a full mask left by the
  // host-bit count. The `prefix === 0` guard avoids the `<< 32`
  // no-op (JS shifts are mod 32) producing 0xffffffff by mistake.
  if (prefix === 0) return 0
  return (0xffffffff << (32 - prefix)) >>> 0
}

/**
 * Parse "a.b.c.d/n" into a structured result. A bare IP with no
 * prefix is treated as /32. Throws on malformed octets or an
 * out-of-range prefix.
 */
export function parseCidr(input: string): CidrResult {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('empty input')

  const slash = trimmed.indexOf('/')
  const ipPart = slash === -1 ? trimmed : trimmed.slice(0, slash)
  const prefixPart = slash === -1 ? '32' : trimmed.slice(slash + 1)

  if (!/^\d+$/.test(prefixPart)) {
    throw new Error(`invalid prefix: ${prefixPart}`)
  }
  const prefix = Number(prefixPart)
  if (prefix > 32) {
    throw new Error(`prefix out of range (0-32): ${prefix}`)
  }

  const ipInt = ipToInt(ipPart)
  const mask = maskForPrefix(prefix)
  const network = (ipInt & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const wildcard = ~mask >>> 0
  const totalAddresses = TWO_32 / 2 ** prefix

  let usableHosts: number
  let firstHost: string
  let lastHost: string
  if (prefix === 32) {
    // Single host: the address itself, no broadcast/network split.
    usableHosts = 1
    firstHost = intToIp(network)
    lastHost = intToIp(network)
  } else if (prefix === 31) {
    // RFC 3021 point-to-point: both addresses are usable hosts.
    usableHosts = 2
    firstHost = intToIp(network)
    lastHost = intToIp(broadcast)
  } else {
    usableHosts = Math.max(0, totalAddresses - 2)
    firstHost = intToIp((network + 1) >>> 0)
    lastHost = intToIp((broadcast - 1) >>> 0)
  }

  return {
    prefix,
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    netmask: intToIp(mask),
    wildcard: intToIp(wildcard),
    firstHost,
    lastHost,
    totalAddresses,
    usableHosts,
    isPrivate: isPrivateInt(network),
  }
}
