/**
 * format.dotenv — pure .env ↔ JSON engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * without a DOM. The Tool wires the UI at the edge.
 *
 * Parsing is deliberately lenient on the things people actually
 * paste — blank lines, `#` comments, and an `export` prefix are all
 * tolerated — but it never coerces types: a .env file is a flat
 * string→string map, so every parsed value is a string. Lines with
 * no `=` are skipped (they're almost always stray comments or
 * fragments); callers that want strictness can diff key counts.
 *
 * The prototype-pollution guard drops `__proto__`, `constructor`,
 * and `prototype` keys on the way in, so a hostile .env can't walk
 * up the object chain of the result.
 */

/** Keys that must never be written onto the result object. */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Parse a .env document into a flat string→string map.
 *
 * - one `KEY=VALUE` per line; the first `=` splits key from value
 * - blank lines and `#` comment lines are ignored
 * - a leading `export ` is stripped (`export KEY=v` → `KEY=v`)
 * - keys are trimmed; lines without `=` are skipped
 * - matching surrounding single/double quotes are stripped
 * - double-quoted values unescape \n \t \\ \"
 * - single-quoted and unquoted values are taken literally (trimmed
 *   when unquoted; verbatim between the quotes when single-quoted)
 * - prototype-polluting keys are dropped
 */
export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue // no assignment — skip stray fragments

    let key = line.slice(0, eq).trim()
    if (key.startsWith('export ')) key = key.slice('export '.length).trim()
    if (key === '') continue
    if (FORBIDDEN_KEYS.has(key)) continue

    out[key] = parseValue(line.slice(eq + 1))
  }
  // Re-home onto a plain object so callers get normal prototype
  // methods back; the null-proto map above only guards assignment.
  return { ...out }
}

/**
 * Decode one raw (post-`=`) .env value.
 *
 * Leading whitespace is dropped. A quoted value is read up to its
 * matching closing quote and anything after it (trailing whitespace
 * and a trailing `# comment`) is ignored. An unquoted value runs to
 * an inline ` #` comment (whitespace then hash) and is then trimmed —
 * a bare `#` with no preceding space stays part of the value.
 */
function parseValue(raw: string): string {
  const s = raw.replace(/^\s+/, '')
  if (s === '') return ''
  const q = s[0]
  if (q === '"' || q === "'") {
    let content = ''
    let i = 1
    for (; i < s.length; i++) {
      const ch = s[i]!
      if (q === '"' && ch === '\\' && i + 1 < s.length) {
        content += ch + s[i + 1]! // keep the escape for the unescape pass
        i++
        continue
      }
      if (ch === q) break
      content += ch
    }
    // No closing quote: lenient — treat the remainder as the value.
    if (i >= s.length) content = s.slice(1)
    return q === '"' ? unescapeDoubleQuoted(content) : content
  }
  // Unquoted: strip an inline " #..." comment, then trim.
  const c = s.search(/\s#/)
  return (c === -1 ? s : s.slice(0, c)).trim()
}

/** Unescape the sequences a double-quoted .env value may carry. */
function unescapeDoubleQuoted(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch !== '\\' || i === s.length - 1) {
      out += ch
      continue
    }
    const next = s[++i]
    switch (next) {
      case 'n':
        out += '\n'
        break
      case 't':
        out += '\t'
        break
      case '\\':
        out += '\\'
        break
      case '"':
        out += '"'
        break
      default:
        // Unknown escape — keep the backslash and the char as-is.
        out += '\\' + next
    }
  }
  return out
}

/**
 * Serialize a flat map to .env text, one `KEY=value` per line.
 *
 * A value is double-quoted (with \n and " escaped) when it contains
 * whitespace, a newline, or a `#`, since any of those would change
 * the meaning of an unquoted line. Non-string values are coerced
 * with String(); object/array values aren't meaningful in .env.
 * Prototype-polluting keys are dropped, mirroring parseEnv.
 */
export function toEnv(obj: Record<string, unknown>): string {
  const lines: string[] = []
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) continue
    // Reject keys that aren't valid env-var names — a key containing
    // '=', a newline, '#', or spaces could otherwise inject extra or
    // malformed assignments into the emitted .env.
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error(`invalid .env key: ${JSON.stringify(key)}`)
    }
    const value = String(obj[key])
    lines.push(`${key}=${needsQuoting(value) ? quote(value) : value}`)
  }
  return lines.join('\n')
}

function needsQuoting(value: string): boolean {
  return /[\s#]/.test(value)
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

/** .env text → pretty JSON object string. */
export function envToJson(text: string): string {
  return JSON.stringify(parseEnv(text), null, 2)
}

/**
 * JSON object string → .env text. Throws when the JSON is not an
 * object (arrays and primitives have no key/value shape to emit).
 */
export function jsonToEnv(jsonText: string): string {
  const parsed = JSON.parse(jsonText) as unknown
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON must be an object of key/value pairs')
  }
  return toEnv(parsed as Record<string, unknown>)
}
