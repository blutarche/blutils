/**
 * format.convert — convert between JSON, YAML, TOML, and CSV.
 *
 * Two-pane layout: editable input on the left, read-only output on
 * the right (or a `chip bad` error when conversion fails). `from`
 * and `to` are segmented format selectors with a swap button
 * between them; conversion re-runs on every keystroke (the engine
 * caps input size, so this stays cheap).
 *
 * The heavy parsers live in the lazy engine.ts, so importing this
 * Tool doesn't pull js-yaml / smol-toml / papaparse into any other
 * page's bundle.
 *
 * The /format/json-to-yaml and /format/yaml-to-json aliases seed
 * `from`/`to` via initialState. Input and the chosen formats both
 * persist through useToolInput (JSON-encoded options blob).
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { type Format, convert } from './engine'

const FORMATS: Format[] = ['json', 'yaml', 'toml', 'csv']

const SAMPLE_JSON = `{"name":"blutils","version":2,"enabled":true,"tags":["json","yaml","toml"],"meta":{"author":"ada","stars":42}}`

function isFormat(x: unknown): x is Format {
  return typeof x === 'string' && (FORMATS as string[]).includes(x)
}

export default function Tool({ initialState }: ToolProps) {
  const [input, setInput] = useToolInput('format.convert', SAMPLE_JSON)

  const seededFrom: Format = isFormat(initialState?.from)
    ? initialState.from
    : 'json'
  const seededTo: Format = isFormat(initialState?.to) ? initialState.to : 'yaml'

  const [from, setFrom] = useSeededState<Format>(seededFrom)
  const [to, setTo] = useSeededState<Format>(seededTo)

  const result = useMemo(() => {
    if (input.trim() === '') return { ok: true as const, value: '' }
    try {
      return { ok: true as const, value: convert(input, from, to) }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, from, to])

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  const copyOutput = () => {
    if (!result.ok) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result.value).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>format.convert</h1>
        {result.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> ok
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> {result.error}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div class="seg-ctrl">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              class={from === f ? 'on' : ''}
              onClick={() => setFrom(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button type="button" class="btn ghost sm" onClick={swap}>
          <Icon name="ArrowLeftRight" size={11} /> swap
        </button>
        <div class="seg-ctrl">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              class={to === f ? 'on' : ''}
              onClick={() => setTo(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <p class="tool-sub">
        Converts between JSON, YAML, TOML, and CSV. No data leaves your browser.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>input ({from})</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => setInput(SAMPLE_JSON)}
              >
                sample
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 360 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>output ({to})</span>
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
          {result.ok ? (
            <textarea
              class="area bare"
              value={result.value}
              readOnly
              spellcheck={false}
              style={{ minHeight: 360 }}
            />
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
