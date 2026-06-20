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
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { CASES } from './engine'

const SAMPLE = 'hello world-foo_barBaz HTTPServer v2'

export default function Tool() {
  const [input, setInput] = useToolInput('text.case', '')
  const [copied, setCopied] = useState<string | null>(null)

  const isEmpty = input.trim() === ''

  const rows = useMemo(
    () => CASES.map((c) => ({ key: c.key, label: c.label, value: c.fn(input) })),
    [input],
  )

  const copy = (text: string, key: string) => {
    if (copyText(text)) {
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>text.case</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
      </div>
      <p class="tool-sub">
        Converts text between naming conventions live. No data leaves your browser.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>input</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
              clear
            </button>
          </span>
        </div>
        <textarea
          class="area bare"
          value={input}
          placeholder="Type or paste text to convert…"
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
          style={{ minHeight: 120 }}
        />
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>output</span>
        </div>
        {isEmpty ? (
          <div class="tool-empty">Converted text appears here in all case formats.</div>
        ) : (
          <div class="panel-b" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((r) => (
              <div
                key={r.key}
                class="hash-row"
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span class="tc-label">{r.label}</span>
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
        )}
      </div>
    </>
  )
}
