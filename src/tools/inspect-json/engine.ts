/**
 * inspect.json — pure JSON tree engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * directly. `parseJson` never throws — it returns a discriminated
 * result the UI switches on for the ok / bad chip. `buildNodes`
 * flattens a parsed value into a depth-tagged node list that the
 * Tool renders as a collapsible tree.
 *
 * A flat list (rather than a nested model) keeps the UI's
 * expand/collapse trivial: collapsed state is a Set of container
 * paths, and rendering walks the list skipping any node whose
 * ancestor path is collapsed.
 */

export type JsonValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'

export type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string }

export interface JsonNode {
  /**
   * The key under the parent: an object property name, an array
   * index as a string, or the synthetic root label '$'.
   */
  key: string
  type: JsonValueType
  /** One-line summary, e.g. "{…} 3 keys", "[…] 5 items", "42". */
  preview: string
  /** 0 at the root, +1 per level of nesting. */
  depth: number
  /** JSONPath-style path, e.g. `$`, `$.users[0].name`. */
  path: string
  /** True for objects and arrays (the only expandable nodes). */
  collapsible: boolean
}

/** Parse text as JSON without ever throwing. */
export function parseJson(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

/** The JSON type of a parsed value. */
export function valueType(v: unknown): JsonValueType {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'object') return 'object'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'string'
}

/** A scalar preview: quoted strings, raw numbers/booleans, `null`. */
function scalarPreview(v: unknown, type: JsonValueType): string {
  if (type === 'string') return JSON.stringify(v)
  if (type === 'null') return 'null'
  return String(v)
}

/** A container preview: "{…} N keys" / "[…] N items". */
function containerPreview(v: unknown, type: JsonValueType): string {
  if (type === 'array') {
    const n = (v as unknown[]).length
    return `[…] ${n} ${n === 1 ? 'item' : 'items'}`
  }
  const n = Object.keys(v as Record<string, unknown>).length
  return `{…} ${n} ${n === 1 ? 'key' : 'keys'}`
}

/** Preview for any value, scalar or container. */
export function previewOf(v: unknown): string {
  const type = valueType(v)
  return type === 'object' || type === 'array'
    ? containerPreview(v, type)
    : scalarPreview(v, type)
}

/**
 * Whether an object key needs bracket-quote notation in a path.
 * Bare dot notation is only safe for identifier-ish keys.
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

/**
 * Flatten a parsed value into a depth-first node list. The root is
 * always emitted with key '$' and path '$'; children follow in
 * document order, each carrying its own JSONPath.
 */
export function buildNodes(value: unknown): JsonNode[] {
  const out: JsonNode[] = []

  const walk = (v: unknown, key: string, path: string, depth: number): void => {
    const type = valueType(v)
    const collapsible = type === 'object' || type === 'array'
    out.push({ key, type, preview: previewOf(v), depth, path, collapsible })

    if (type === 'array') {
      const arr = v as unknown[]
      for (let i = 0; i < arr.length; i++) {
        walk(arr[i], String(i), `${path}[${i}]`, depth + 1)
      }
    } else if (type === 'object') {
      const obj = v as Record<string, unknown>
      for (const k of Object.keys(obj)) {
        walk(obj[k], k, childObjectPath(path, k), depth + 1)
      }
    }
  }

  walk(value, '$', '$', 0)
  return out
}
