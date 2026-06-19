/**
 * text.case — convert text between naming conventions.
 *
 * Single input textarea; every conversion from the shared `CASES`
 * registry renders at once as a labeled row with its own copy
 * button, so all cases are reachable without a mode switch.
 *
 * Input persists through useToolInput (sessionStorage by default,
 * localStorage when the user has opted into rememberInputs).
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { CASES } from './engine'

const SAMPLE = 'hello world-foo_barBaz HTTPServer v2'

export default function Tool() {
  const [input, setInput] = useToolInput('text.case', SAMPLE)
  const [copied, setCopied] = useState<string | null>(null)

  const rows = useMemo(
    () => CASES.map((c) => ({ key: c.key, label: c.label, value: c.fn(input) })),
    [input],
  )

  const copy = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>text.case</h1>
        <div style={{ flex: 1 }} />
        <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
          clear
        </button>
        <button class="btn ghost sm" type="button" onClick={() => setInput(SAMPLE)}>
          sample
        </button>
      </div>
      <p class="tool-sub">
        Converts text between naming conventions live. No data leaves your browser.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>input</span>
        </div>
        <textarea
          class="area bare"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
          style={{ minHeight: 120 }}
        />
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>output</span>
        </div>
        <div class="panel-b" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((r) => (
            <div
              key={r.key}
              class="hash-row"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ color: 'var(--muted)', minWidth: 130 }}>{r.label}</span>
              <code style={{ flex: 1, wordBreak: 'break-all' }}>{r.value}</code>
              <button
                class="btn ghost sm"
                type="button"
                disabled={r.value.length === 0}
                onClick={() => copy(r.value, r.key)}
              >
                <Icon name={copied === r.key ? 'Check' : 'Copy'} size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
