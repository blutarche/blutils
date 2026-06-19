/**
 * inspect.chmod — pure octal ↔ symbolic permission engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * without a DOM. The Tool wires the structured `Permissions`
 * representation to a 3×3 checkbox grid and reads `toOctal` /
 * `toSymbolic` back out on every toggle.
 *
 * Scope: standard 3-digit POSIX permission modes only. The special
 * setuid / setgid / sticky bits (the leading 4th octal digit) are
 * intentionally out of scope — every digit here is a plain rwx
 * triad in the range 0-7.
 */

/** Read/write/execute flags for a single owner|group|other class. */
export interface PermClass {
  r: boolean
  w: boolean
  x: boolean
}

/** Structured permissions the UI toggles bit by bit. */
export interface Permissions {
  owner: PermClass
  group: PermClass
  other: PermClass
}

/** The three classes, in octal-digit order (owner, group, other). */
const CLASS_ORDER = ['owner', 'group', 'other'] as const

/** One octal digit (0-7) → its r/w/x flags. */
function digitToClass(digit: number): PermClass {
  return {
    r: (digit & 0b100) !== 0,
    w: (digit & 0b010) !== 0,
    x: (digit & 0b001) !== 0,
  }
}

/** r/w/x flags → one octal digit (0-7). */
function classToDigit(c: PermClass): number {
  return (c.r ? 4 : 0) + (c.w ? 2 : 0) + (c.x ? 1 : 0)
}

/** One class → its 3-char "rwx" / "-" fragment. */
function classToSymbolic(c: PermClass): string {
  return (c.r ? 'r' : '-') + (c.w ? 'w' : '-') + (c.x ? 'x' : '-')
}

/**
 * Parse a 3-char "rwx"-style fragment into r/w/x flags. Each slot
 * must be its own letter (r in slot 0, w in slot 1, x in slot 2) or
 * a dash; anything else throws.
 */
function symbolicFragmentToClass(frag: string): PermClass {
  const slots: Array<['r' | 'w' | 'x', keyof PermClass]> = [
    ['r', 'r'],
    ['w', 'w'],
    ['x', 'x'],
  ]
  const out: PermClass = { r: false, w: false, x: false }
  for (let i = 0; i < 3; i++) {
    const ch = frag[i]
    const [letter, key] = slots[i]!
    if (ch === letter) out[key] = true
    else if (ch !== '-')
      throw new Error(
        `invalid symbolic char "${ch}" at position ${i}: expected "${letter}" or "-"`,
      )
  }
  return out
}

/**
 * Parse a 3-digit octal mode string (or number) into structured
 * Permissions. Accepts exactly three digits, each 0-7.
 */
export function parseOctal(octal: string | number): Permissions {
  const str = String(octal)
  if (!/^[0-7]{3}$/.test(str)) {
    throw new Error(
      `invalid octal mode "${str}": expected exactly 3 digits, each 0-7`,
    )
  }
  const [owner, group, other] = [...str].map((d) => digitToClass(Number(d)))
  return { owner: owner!, group: group!, other: other! }
}

/**
 * Parse a 9-char symbolic string (e.g. "rwxr-xr-x") into structured
 * Permissions. Must be exactly 9 chars of r/w/x/- in rwx-triad order.
 */
export function parseSymbolic(sym: string): Permissions {
  if (sym.length !== 9) {
    throw new Error(
      `invalid symbolic mode "${sym}": expected exactly 9 characters`,
    )
  }
  return {
    owner: symbolicFragmentToClass(sym.slice(0, 3)),
    group: symbolicFragmentToClass(sym.slice(3, 6)),
    other: symbolicFragmentToClass(sym.slice(6, 9)),
  }
}

/** Structured Permissions → 3-digit octal string, e.g. "755". */
export function toOctal(perms: Permissions): string {
  return CLASS_ORDER.map((k) => classToDigit(perms[k])).join('')
}

/** Structured Permissions → 9-char symbolic string, e.g. "rwxr-xr-x". */
export function toSymbolic(perms: Permissions): string {
  return CLASS_ORDER.map((k) => classToSymbolic(perms[k])).join('')
}

/** Convenience: octal mode → 9-char symbolic string. */
export function octalToSymbolic(octal: string | number): string {
  return toSymbolic(parseOctal(octal))
}

/** Convenience: 9-char symbolic string → 3-digit octal string. */
export function symbolicToOctal(sym: string): string {
  return toOctal(parseSymbolic(sym))
}
