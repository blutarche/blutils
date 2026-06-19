/**
 * inspect.jsondiff — pure structural JSON diff engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * directly. `diffJson` walks two already-parsed values in parallel
 * and emits a flat list of changes, each carrying a JSONPath-style
 * `path` and the `before` / `after` values that differ there.
 *
 * Comparison rules:
 *   - Plain objects compare by key; key order is irrelevant, so
 *     `{a:1,b:2}` and `{b:2,a:1}` produce no diff. A key only in A
 *     is 'removed'; only in B is 'added'; in both with differing
 *     values recurses.
 *   - Arrays compare by index; order is significant. A shorter side
 *     yields 'removed'/'added' entries for the surplus indices.
 *   - Primitives, and any two values whose JSON types differ (e.g.
 *     number vs string, object vs array), compare by equality and
 *     emit a single 'changed' when unequal.
 *
 * `parseAndDiff` is the UI entry point: it JSON.parses both inputs,
 * returning a clear error (never throwing) when either is invalid,
 * otherwise the change list from `diffJson`.
 *
 * Ordering is document order from a depth-first walk of A (with
 * B-only additions surfaced in B's key/index order at their level),
 * which is stable and deterministic for a given pair of inputs.
 */

export type ChangeType = 'added' | 'removed' | 'changed'

export interface JsonChange {
  /** JSONPath-style path, e.g. `$`, `$.user.tags[2]`. */
  path: string
  type: ChangeType
  /** Value on side A. Absent for 'added'. */
  before?: unknown
  /** Value on side B. Absent for 'removed'. */
  after?: unknown
}

export type DiffResult =
  | { ok: true; changes: JsonChange[] }
  | { ok: false; error: string }

/** True only for non-null, non-array plain objects. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Whether an object key needs bracket-quote notation in a path.
 * Bare dot notation is only safe for identifier-ish keys. Mirrors
 * the inspect.json engine so both tools render paths identically.
 */
function isPlainKey(key: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
}

/** Extend a parent path with an object property. */
function childObjectPath(parent: string, key: string): string {
  return isPlainKey(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`
}

/** Strict structural equality for JSON values (key order irrelevant). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a)
    const bk = Object.keys(b)
    if (ak.length !== bk.length) return false
    for (const k of ak) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false
      if (!deepEqual(a[k], b[k])) return false
    }
    return true
  }

  return false
}

/**
 * Compare two already-parsed JSON values and return the flat,
 * deterministically-ordered list of structural changes between them.
 */
/** Deepest structure we'll walk before bailing with a clear error. */
const MAX_DEPTH = 200

export function diffJson(a: unknown, b: unknown): JsonChange[] {
  const out: JsonChange[] = []

  const walk = (x: unknown, y: unknown, path: string, depth: number): void => {
    if (depth > MAX_DEPTH) {
      throw new Error('structure too deeply nested')
    }
    if (Array.isArray(x) && Array.isArray(y)) {
      const len = Math.max(x.length, y.length)
      for (let i = 0; i < len; i++) {
        const childPath = `${path}[${i}]`
        if (i >= x.length) {
          out.push({ path: childPath, type: 'added', after: y[i] })
        } else if (i >= y.length) {
          out.push({ path: childPath, type: 'removed', before: x[i] })
        } else {
          walk(x[i], y[i], childPath, depth + 1)
        }
      }
      return
    }

    if (isPlainObject(x) && isPlainObject(y)) {
      for (const k of Object.keys(x)) {
        const childPath = childObjectPath(path, k)
        if (Object.prototype.hasOwnProperty.call(y, k)) {
          walk(x[k], y[k], childPath, depth + 1)
        } else {
          out.push({ path: childPath, type: 'removed', before: x[k] })
        }
      }
      for (const k of Object.keys(y)) {
        if (!Object.prototype.hasOwnProperty.call(x, k)) {
          out.push({
            path: childObjectPath(path, k),
            type: 'added',
            after: y[k],
          })
        }
      }
      return
    }

    // Primitives, or two values of mismatched container/primitive
    // type: a single 'changed' when they aren't deeply equal.
    if (!deepEqual(x, y)) {
      out.push({ path, type: 'changed', before: x, after: y })
    }
  }

  walk(a, b, '$', 0)
  return out
}

/**
 * Parse both inputs as JSON (never throwing) and diff them. Returns
 * a clear, side-attributed error when either input is invalid.
 */
export function parseAndDiff(textA: string, textB: string): DiffResult {
  let a: unknown
  try {
    a = JSON.parse(textA) as unknown
  } catch (err) {
    return { ok: false, error: `A is invalid JSON: ${(err as Error).message}` }
  }

  let b: unknown
  try {
    b = JSON.parse(textB) as unknown
  } catch (err) {
    return { ok: false, error: `B is invalid JSON: ${(err as Error).message}` }
  }

  try {
    return { ok: true, changes: diffJson(a, b) }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
