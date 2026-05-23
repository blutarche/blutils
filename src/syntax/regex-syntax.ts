/**
 * Regex pattern highlighter.
 *
 * Renders a JavaScript regex source string as colored spans so a
 * Tool can show structure inline. Token categories:
 *
 *   - escape:    backslash sequences (\w, \d, \s, \., \\)
 *   - class:     character classes [ ... ]
 *   - group:     ( ) and (?<name> ...) and non-capturing (?: ...)
 *   - quant:     * + ? {n,m}
 *   - anchor:    ^ $ \b \B
 *   - alt:       |
 *   - punct:     . , - inside a class context
 *   - default:   literal chars, escaped through escapeHtml
 *
 * Designed for a small preview strip — does not validate the
 * pattern (the Tool's own RegExp constructor handles errors).
 */

const ENTITY: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ENTITY[c]!)
}

function span(cls: string, value: string): string {
  return `<span class="tok-${cls}">${escapeHtml(value)}</span>`
}

export function highlightRegex(pattern: string): string {
  const out: string[] = []
  let i = 0
  let inClass = false
  while (i < pattern.length) {
    const c = pattern[i]!
    if (c === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1]!
      if (next === 'b' || next === 'B') {
        out.push(span('anchor', '\\' + next))
      } else {
        out.push(span('escape', '\\' + next))
      }
      i += 2
      continue
    }
    if (!inClass && c === '[') {
      inClass = true
      out.push(span('class', '['))
      i++
      continue
    }
    if (inClass && c === ']') {
      inClass = false
      out.push(span('class', ']'))
      i++
      continue
    }
    if (inClass) {
      out.push(`<span class="tok-class">${escapeHtml(c)}</span>`)
      i++
      continue
    }
    if (c === '(') {
      // Detect (?<name>, (?:, (?=, (?!
      if (pattern.slice(i, i + 3) === '(?<') {
        const close = pattern.indexOf('>', i + 3)
        if (close > -1) {
          out.push(span('group', pattern.slice(i, close + 1)))
          i = close + 1
          continue
        }
      }
      if (pattern.slice(i, i + 3) === '(?:' || pattern.slice(i, i + 3) === '(?=' || pattern.slice(i, i + 3) === '(?!') {
        out.push(span('group', pattern.slice(i, i + 3)))
        i += 3
        continue
      }
      out.push(span('group', '('))
      i++
      continue
    }
    if (c === ')') {
      out.push(span('group', ')'))
      i++
      continue
    }
    if (c === '*' || c === '+' || c === '?') {
      out.push(span('quant', c))
      i++
      continue
    }
    if (c === '{') {
      const close = pattern.indexOf('}', i)
      if (close > -1) {
        out.push(span('quant', pattern.slice(i, close + 1)))
        i = close + 1
        continue
      }
    }
    if (c === '^' || c === '$') {
      out.push(span('anchor', c))
      i++
      continue
    }
    if (c === '|') {
      out.push(span('alt', c))
      i++
      continue
    }
    if (c === '.') {
      out.push(span('escape', c))
      i++
      continue
    }
    out.push(escapeHtml(c))
    i++
  }
  return out.join('')
}
