/**
 * JSON syntax highlighter.
 *
 * JSON's grammar is small, fully specified, and has no string-
 * comment-template edge cases — so a hand-rolled tokenizer is the
 * right tool here. Roughly 60 lines, zero dependencies, exact by
 * construction. (For the markdown Tool's polyglot code blocks we
 * delegate to Prism, where the maintenance burden of getting JS /
 * regex literals / template strings / JSX right is real.)
 *
 * Returns an HTML string of `<span class="tok-…">` tokens —
 * dompurify allows them through its default profile, the syntax.css
 * stylesheet colors them via design tokens so theme flips travel
 * without re-running the tokenizer.
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

export function highlightJson(code: string): string {
  const out: string[] = []
  let i = 0
  while (i < code.length) {
    const c = code[i]!
    if (c === '\n' || c === ' ' || c === '\t' || c === '\r') {
      out.push(c === '\n' ? '\n' : escapeHtml(c))
      i++
      continue
    }
    if (c === '"') {
      // Walk to the closing quote, honoring backslash escapes.
      let j = i + 1
      while (j < code.length) {
        if (code[j] === '\\') {
          j += 2
          continue
        }
        if (code[j] === '"') break
        j++
      }
      const literal = code.slice(i, j + 1)
      // Determine key vs string by peeking past whitespace for ':'.
      let k = j + 1
      while (k < code.length && /\s/.test(code[k]!)) k++
      const isKey = code[k] === ':'
      out.push(span(isKey ? 'key' : 'string', literal))
      i = j + 1
      continue
    }
    if (c === '-' || (c >= '0' && c <= '9')) {
      const rest = code.slice(i)
      const m = rest.match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/)
      if (m) {
        out.push(span('number', m[0]))
        i += m[0].length
        continue
      }
    }
    if (c === 't' || c === 'f' || c === 'n') {
      const rest = code.slice(i)
      const m = rest.match(/^(true|false|null)\b/)
      if (m) {
        out.push(span('bool', m[0]))
        i += m[0].length
        continue
      }
    }
    if (c === '{' || c === '}' || c === '[' || c === ']' || c === ',' || c === ':') {
      out.push(span('punct', c))
      i++
      continue
    }
    out.push(escapeHtml(c))
    i++
  }
  return out.join('')
}
