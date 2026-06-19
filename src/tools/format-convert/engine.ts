/**
 * format.convert — pure data-format conversion engine.
 *
 * Converts between JSON, YAML, TOML, and CSV by parsing into a
 * plain JS value and re-serializing. Both directions go through
 * `sanitize`, which rebuilds the structure copying only own keys
 * so a hostile pasted payload can't reach `Object.prototype`.
 *
 * Heavy parser deps (js-yaml, smol-toml, papaparse) are imported
 * statically here on purpose: this module is lazy-loaded by
 * Tool.tsx and is NOT in the eagerly-bundled shell, so the cost is
 * paid only when this Tool opens — never on other pages. The
 * sibling ops/detect convention is deliberately skipped for the
 * same reason (it would drag these deps into the shell bundle).
 *
 * Everything is synchronous (static imports) and side-effect-free,
 * so the engine is unit-testable in isolation. Errors are thrown
 * as plain Error with messages the UI surfaces verbatim.
 */

import { load, dump } from 'js-yaml'
import { parse as tomlParse, stringify as tomlStringify } from 'smol-toml'
import Papa from 'papaparse'

export type Format = 'json' | 'yaml' | 'toml' | 'csv'

/** Largest input we'll touch, in bytes. Guards against paste bombs. */
export const MAX_INPUT_BYTES = 2_000_000
/** Deepest structure we'll rebuild. Guards billion-laughs blowups. */
export const MAX_DEPTH = 100

/** Keys that can poison the prototype chain — never copied through. */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function byteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length
  }
  // Fallback proxy when TextEncoder is unavailable (close enough).
  return text.length
}

function assertWithinSize(text: string): void {
  if (byteLength(text) > MAX_INPUT_BYTES) {
    throw new Error('input too large')
  }
}

/**
 * Deep-rebuild a parsed value into prototype-clean structures.
 *
 * Plain objects are recreated with `Object.create(null)`-free
 * literals copying only own, non-forbidden keys; arrays map
 * through recursively; primitives pass through. Anything exceeding
 * MAX_DEPTH throws. This is the prototype-pollution quarantine for
 * untrusted parser output.
 */
export function sanitize(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    throw new Error('structure too deeply nested')
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1))
  }
  // Dates (YAML timestamps, TOML datetimes — smol-toml's TomlDate
  // extends Date) are scalar values, not key/value structures.
  // Pass them through intact; rebuilding them as plain objects via
  // Object.keys would silently collapse them to `{}`.
  if (value instanceof Date) {
    return value
  }
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(src)) {
      if (FORBIDDEN_KEYS.has(key)) continue
      out[key] = sanitize(src[key], depth + 1)
    }
    return out
  }
  return value
}

export function parse(text: string, from: Format): unknown {
  assertWithinSize(text)
  switch (from) {
    case 'json':
      return sanitize(JSON.parse(text))
    case 'yaml':
      // load() is safe by default in js-yaml v4 — no code execution.
      return sanitize(load(text))
    case 'toml':
      return sanitize(tomlParse(text))
    case 'csv': {
      const result = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
      })
      // Papa returns partial data plus an errors array on malformed
      // input (unterminated quotes, ragged rows). Surface it instead
      // of silently presenting half-parsed rows as a clean result.
      if (result.errors.length > 0) {
        throw new Error(`CSV parse error: ${result.errors[0]!.message}`)
      }
      return sanitize(result.data)
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function serialize(value: unknown, to: Format): string {
  switch (to) {
    case 'json':
      return JSON.stringify(value, null, 2)
    case 'yaml':
      return dump(value)
    case 'toml': {
      // TOML's top level is a table — only a plain object qualifies.
      if (!isPlainObject(value)) {
        throw new Error('TOML output requires a top-level object')
      }
      return tomlStringify(value as Record<string, unknown>)
    }
    case 'csv': {
      // CSV is a table of rows. Accept an array of row objects;
      // wrap a lone object as a single row; reject anything else.
      let rows: unknown[]
      if (Array.isArray(value)) {
        rows = value
      } else if (isPlainObject(value)) {
        rows = [value]
      } else {
        throw new Error('CSV output requires an array of rows or an object')
      }
      return Papa.unparse(rows, { escapeFormulae: true })
    }
  }
}

export function convert(text: string, from: Format, to: Format): string {
  return serialize(parse(text, from), to)
}
