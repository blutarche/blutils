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
import { marked } from 'marked'
import { useToolInput } from '../../storage/use-tool-input'

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

export default function Tool() {
  const [text, setText] = useToolInput('format.markdown', SAMPLE)

  const html = useMemo(() => {
    const raw = marked.parse(text, { async: false }) as string
    if (typeof window === 'undefined') return raw
    return DOMPurify.sanitize(raw)
  }, [text])

  return (
    <>
      <div class="tool-head">
        <h1>markdown.preview</h1>
        <span class="chip">{text.split('\n').length} lines</span>
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">CommonMark, sanitised, rendered as you type.</p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>source</span>
          </div>
          <textarea
            class="area bare"
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 380 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>preview</span>
          </div>
          <div
            class="panel-b md-prev"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </>
  )
}
