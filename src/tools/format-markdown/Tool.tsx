/**
 * format.markdown — live CommonMark preview.
 *
 * `marked` parses; `DOMPurify` sanitises the output before we feed
 * it through dangerouslySetInnerHTML. Both libraries live inside
 * this Tool's lazy chunk so the shell bundle stays untouched —
 * Suspense awaits the chunk on first navigation.
 *
 * Sanitisation is non-negotiable: marked happily produces raw
 * <script>/<iframe>/<form> tags from clever input, and the
 * application CSP would block runtime execution but the markup
 * would still leak through. DOMPurify with its default profile
 * strips event handlers, script tags, and javascript: URIs.
 */

import { useMemo } from 'preact/hooks'
import DOMPurify from 'dompurify'
import { marked, type Tokens } from 'marked'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup' // html / xml
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-diff'
import { useToolInput } from '../../storage/use-tool-input'
import { Icon } from '../../icons/Icon'

const LANG_ALIAS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  shell: 'bash',
  html: 'markup',
  xml: 'markup',
  yml: 'yaml',
  md: 'markdown',
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  )
}

function highlightCode(code: string, lang: string): string {
  const key = LANG_ALIAS[lang] ?? lang
  const grammar = key ? Prism.languages[key] : undefined
  if (!grammar) return escapeHtml(code)
  return Prism.highlight(code, grammar, key)
}

const SAMPLE = `# Blutils Notes

Local-only dev utilities. **Lightning fast.**

## Features
- JSON formatter
- Hash generator
- Regex tester
- And ✨ more

> "An app like Devutils, but in the browser."

\`\`\`bash
$ blu json fmt < data.json | hash sha256
\`\`\`

See the [docs](#) for more.
`

marked.setOptions({ gfm: true, breaks: false })

// Syntax-highlight fenced code blocks via our shared tokenizer.
// The output is plain HTML (only <span class="tok-…"> tags), which
// dompurify allows through its default profile.
marked.use({
  renderer: {
    code(token: Tokens.Code) {
      const lang = (token.lang ?? '').trim().toLowerCase()
      const body = highlightCode(token.text, lang)
      const cls = lang ? ` class="language-${lang}"` : ''
      return `<pre><code${cls}>${body}</code></pre>\n`
    },
  },
})

export default function Tool() {
  const [text, setText] = useToolInput('format.markdown', '')

  const isEmpty = text.trim() === ''

  const html = useMemo(() => {
    if (isEmpty) return ''
    const raw = marked.parse(text, { async: false }) as string
    if (typeof window === 'undefined') return raw
    return DOMPurify.sanitize(raw)
  }, [text, isEmpty])

  return (
    <>
      <div class="tool-head">
        <h1>markdown.preview</h1>
        <button type="button" class="btn ghost sm" onClick={() => setText(SAMPLE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {isEmpty ? null : (
          <span class="chip">{text.split('\n').length} lines</span>
        )}
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">CommonMark, sanitised, rendered as you type.</p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>source</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setText('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={text}
            placeholder={'Paste Markdown here…\n\ne.g. # Hello **world**'}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 380 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>preview</span>
          </div>
          {isEmpty ? (
            <div class="tool-empty">Rendered preview appears here.</div>
          ) : (
            <div
              class="panel-b md-prev"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    </>
  )
}
