/**
 * inspect.hashid — pure hash-shape identifier.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * directly. We don't crack anything — we only match the *shape* of
 * the input against known digest and password-hash schemes and
 * return ranked candidates, best-first.
 *
 * Two recognition families:
 *
 *   1. Prefixed schemes ($2b$…, $argon2id$…, $6$…). The prefix is a
 *      strong tell, so these are 'high' confidence.
 *   2. Pure-hex digests, matched by exact length. Many algorithms
 *      share a length (32 hex chars is MD5 *or* NTLM *or* MD4), so
 *      these are at best 'medium' and the ambiguity is spelled out
 *      in `note`.
 *
 * Anything that doesn't match yields a single low-confidence
 * 'unknown' candidate; empty input yields [].
 */

export type Confidence = 'high' | 'medium' | 'low'

export interface Candidate {
  name: string
  confidence: Confidence
  note?: string
}

/**
 * Prefixed password-hash schemes. `prefix` is the cheap tell; `full`
 * is the complete structural shape. A full match is 'high' confidence;
 * a prefix-only match (right marker, wrong/incomplete body) drops to
 * 'medium' with a note, so a bare `$2b$` or `$6$garbage` isn't sold as
 * a definite bcrypt/SHA-crypt hash. Entries are mutually exclusive.
 */
const PREFIXES: Array<{
  prefix: RegExp
  full: RegExp
  name: string
}> = [
  {
    prefix: /^\$2[aby]\$/,
    full: /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/,
    name: 'bcrypt',
  },
  {
    prefix: /^\$argon2(id|i|d)\$/,
    full: /^\$argon2(id|i|d)\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/,
    name: 'Argon2',
  },
  {
    prefix: /^\$6\$/,
    full: /^\$6\$(rounds=\d+\$)?[^$\n]{1,16}\$[./A-Za-z0-9]{86}$/,
    name: 'SHA-512 crypt',
  },
  {
    prefix: /^\$5\$/,
    full: /^\$5\$(rounds=\d+\$)?[^$\n]{1,16}\$[./A-Za-z0-9]{43}$/,
    name: 'SHA-256 crypt',
  },
  {
    prefix: /^\$1\$/,
    full: /^\$1\$[^$\n]{1,8}\$[./A-Za-z0-9]{22}$/,
    name: 'MD5 crypt',
  },
]

/**
 * Pure-hex digests keyed by exact length. Each length maps to one or
 * more algorithms; when more than one shares the length the match is
 * inherently ambiguous, so we tag every hex match 'medium' (or 'low'
 * for the short checksums) and list the alternatives in `note`.
 */
const HEX_LENGTHS: Record<number, { algos: string[]; confidence: Confidence }> = {
  8: { algos: ['CRC-32', 'Adler-32'], confidence: 'low' },
  32: { algos: ['MD5', 'NTLM', 'MD4'], confidence: 'medium' },
  40: { algos: ['SHA-1', 'RIPEMD-160'], confidence: 'medium' },
  56: { algos: ['SHA-224'], confidence: 'medium' },
  64: { algos: ['SHA-256', 'SHA3-256', 'BLAKE2s'], confidence: 'medium' },
  96: { algos: ['SHA-384'], confidence: 'medium' },
  128: { algos: ['SHA-512', 'SHA3-512', 'BLAKE2b'], confidence: 'medium' },
}

function hexCandidates(t: string): Candidate[] {
  const entry = HEX_LENGTHS[t.length]
  if (!entry) return []
  const note =
    entry.algos.length > 1
      ? `${t.length} hex chars — ambiguous: ${entry.algos.join(', ')}`
      : `${t.length} hex chars`
  return entry.algos.map((name) => ({
    name,
    confidence: entry.confidence,
    note,
  }))
}

const HEX_RE = /^[0-9a-f]+$/i

/**
 * Identify the candidate algorithms behind `input`, best-first.
 * Returns [] for empty input; a single low-confidence 'unknown'
 * candidate when nothing matches.
 */
export function identify(input: string): Candidate[] {
  const t = input.trim()
  if (t === '') return []

  for (const { prefix, full, name } of PREFIXES) {
    if (!prefix.test(t)) continue
    return full.test(t)
      ? [{ name, confidence: 'high' }]
      : [
          {
            name,
            confidence: 'medium',
            note: `${name} prefix, but the structure doesn't fully match`,
          },
        ]
  }

  if (HEX_RE.test(t)) {
    const hex = hexCandidates(t)
    if (hex.length > 0) return hex
  }

  return [
    { name: 'unknown', confidence: 'low', note: 'not a recognized hash' },
  ]
}
