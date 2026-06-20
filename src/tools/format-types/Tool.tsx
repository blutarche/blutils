/**
 * format.types — JSON → TypeScript types.
 *
 * Two-pane layout mirroring format.json: editable JSON on the left,
 * generated TypeScript on the right (or an error block when the
 * input doesn't parse). The head carries a root-name field that
 * seeds the top-level interface; all inference lives in the pure
 * engine so the component stays a thin wrapper that re-runs on
 * every keystroke.
 *
 * Input persists through useToolInput so a reload keeps your
 * payload (sessionStorage by default, localStorage when the user
 * has opted into rememberInputs).
 */

import { useMemo, useState } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { jsonToTypes } from './engine'

const SAMPLE_JSON = `{"id":1,"name":"Ada","active":true,"tags":["beta","admin"],"roles":[{"name":"owner","level":9},{"name":"editor"}],"meta":{"twoFA":true,"lastLogin":1747800000}}`

export default function Tool(_props: ToolProps) {
  const [input, setInput] = useToolInput('format.types', '')
  const [rootName, setRootName] = useState('Root')

  const isEmpty = input.trim() === ''

  const result = useMemo(() => {
    if (isEmpty) return { ok: true as const, value: '' }
    try {
      return {
        ok: true as const,
        value: jsonToTypes(input, { rootName: rootName || 'Root' }),
      }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, rootName, isEmpty])

  const copyOutput = () => {
    if (!result.ok) return
    copyText(result.value)
  }

  return (
    <>
      <div class="tool-head">
        <h1>json.to.types</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE_JSON)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {isEmpty ? null : result.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> valid
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ color: 'var(--muted)' }}>root</span>
        <input
          class="input"
          type="text"
          value={rootName}
          spellcheck={false}
          style={{ width: 140 }}
          onInput={(e) => setRootName((e.target as HTMLInputElement).value)}
        />
      </div>
      <p class="tool-sub">
        Infers TypeScript interfaces from a JSON sample. Runs live. No data
        leaves your browser.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>json</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={'Paste JSON here…\n\ne.g. {"name":"Ada","active":true}'}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 360 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>typescript</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                disabled={!result.ok}
                onClick={copyOutput}
              >
                <Icon name="Copy" size={11} /> copy
              </button>
            </span>
          </div>
          {isEmpty ? (
            <div class="tool-empty">Generated TypeScript interfaces appear here.</div>
          ) : result.ok ? (
            <pre class="hl-block">{result.value}</pre>
          ) : (
            <div style={{ padding: 14 }}>
              <div class="json-error">{result.error}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
