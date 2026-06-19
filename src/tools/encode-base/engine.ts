/**
 * encode.base — pure integer radix engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * without a DOM. Everything runs through BigInt, so arbitrarily
 * large integers convert losslessly — no Number precision ceiling.
 *
 * Bases span 2..36, using the canonical 0-9a-z digit alphabet.
 * Output is always lowercase. `parseInBase` validates every digit
 * against the source base and throws on the first stray one, so the
 * Tool can surface a precise error rather than silently coercing.
 *
 * The `0x` / `0b` / `0o` prefixes are honoured when they match the
 * requested base (or in `auto` mode, where the prefix *selects* the
 * base). A leading `-` is accepted for negative integers.
 */

export const MIN_BASE = 2
export const MAX_BASE = 36

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

/** Source base, or 'auto' to infer it from a 0x/0b/0o prefix. */
export type FromBase = number | 'auto'

/** Map a single digit character to its value, or -1 if not a digit. */
function digitValue(ch: string): number {
  const c = ch.toLowerCase()
  const v = DIGITS.indexOf(c)
  return v
}

function assertBase(base: number): void {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) {
    throw new Error(`base must be an integer in ${MIN_BASE}..${MAX_BASE}`)
  }
}

/**
 * Strip a radix prefix (0x/0b/0o) from an already sign-stripped,
 * lowercased string. Returns the remaining digits plus the base the
 * prefix implies, or null when there is no recognised prefix.
 */
function prefixBase(body: string): { base: number; rest: string } | null {
  if (body.startsWith('0x')) return { base: 16, rest: body.slice(2) }
  if (body.startsWith('0b')) return { base: 2, rest: body.slice(2) }
  if (body.startsWith('0o')) return { base: 8, rest: body.slice(2) }
  return null
}

/**
 * Parse `str` written in `from` into a bigint.
 *
 * In `auto` mode the base is taken from a 0x/0b/0o prefix, defaulting
 * to 10 when none is present. With an explicit numeric base, a prefix
 * is accepted only when it agrees with that base; a conflicting
 * prefix (e.g. "0x" with base 10) throws.
 */
export function parseInBase(str: string, from: FromBase): bigint {
  let s = str.trim().toLowerCase()
  if (s === '') throw new Error('empty input')

  let negative = false
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1)
  } else if (s.startsWith('+')) {
    s = s.slice(1)
  }
  if (s === '') throw new Error('no digits after sign')

  let base: number
  let digits: string
  const pre = prefixBase(s)

  if (from === 'auto') {
    if (pre) {
      base = pre.base
      digits = pre.rest
    } else {
      base = 10
      digits = s
    }
  } else {
    assertBase(from)
    base = from
    if (pre) {
      if (pre.base !== from) {
        throw new Error(
          `prefix implies base ${pre.base} but base ${from} was requested`,
        )
      }
      digits = pre.rest
    } else {
      digits = s
    }
  }

  // Tolerate an underscore digit-grouping separator (1_000, 0xFF_FF),
  // but only *between* digits — a leading, trailing, or doubled
  // underscore is a typo, not grouping, so reject it rather than
  // silently stripping it.
  if (digits.includes('_')) {
    if (/^_|_$|__/.test(digits)) {
      throw new Error('misplaced underscore separator')
    }
    digits = digits.replace(/_/g, '')
  }
  if (digits === '') throw new Error('no digits to parse')

  const bigBase = BigInt(base)
  let value = 0n
  for (const ch of digits) {
    const d = digitValue(ch)
    if (d < 0 || d >= base) {
      throw new Error(`invalid digit '${ch}' for base ${base}`)
    }
    value = value * bigBase + BigInt(d)
  }
  return negative ? -value : value
}

/** Render a bigint in `to` (2..36) as a lowercase string. */
export function toBase(value: bigint, to: number): string {
  assertBase(to)
  if (value === 0n) return '0'

  const negative = value < 0n
  let n = negative ? -value : value
  const bigBase = BigInt(to)
  let out = ''
  while (n > 0n) {
    const rem = Number(n % bigBase)
    out = DIGITS[rem]! + out
    n = n / bigBase
  }
  return negative ? '-' + out : out
}

export const toBinary = (value: bigint): string => toBase(value, 2)
export const toOctal = (value: bigint): string => toBase(value, 8)
export const toDecimal = (value: bigint): string => toBase(value, 10)
export const toHex = (value: bigint): string => toBase(value, 16)
