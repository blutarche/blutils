/**
 * format.dotenv — .env ↔ JSON converter.
 *
 * Two operating modes — .env → JSON and JSON → .env — toggled by a
 * segmented header control. Parsing tolerates the things people
 * paste (blank lines, `#` comments, an `export` prefix), strips
 * matching surrounding quotes, and unescapes \n \t \\ \" inside
 * double-quoted values; the inverse quotes any value that carries
 * whitespace, a newline, or a `#`. A flat string→string map is the
 * shared shape, so every JSON value round-trips as a string.
 *
 * JSON → .env surfaces an error chip when the input isn't valid
 * JSON or isn't an object. The engine drops prototype-polluting
 * keys (`__proto__`/`constructor`/`prototype`) in both directions.
 *
 * Input persists via useToolInput so a refresh keeps your payload.
 * Aliases /format/env-to-json and /format/json-to-env seed the mode
 * for direct linking.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { envToJson, jsonToEnv } from './engine'

type Mode = 'toJson' | 'toEnv'

const SAMPLE_ENV = `# app config — local only
export NODE_ENV=development
PORT=3000
DATABASE_URL="postgres://user:pass@localhost:5432/app"
GREETING="hello world"
SECRET='r4w-t0ken'`

export default function Tool({ initialState }: ToolProps) {
  const seededMode: Mode = initialState?.mode === 'toEnv' ? 'toEnv' : 'toJson'

  const [mode, setMode] = useSeededState<Mode>(seededMode)
  const [input, setInput] = useToolInput('format.dotenv', '')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: '' }
    try {
      const value = mode === 'toJson' ? envToJson(input) : jsonToEnv(input)
      return { ok: true as const, value }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, mode])

  const copy = () => {
    if (!result.ok) return
    copyText(result.value)
  }

  return (
    <>
      <div class="tool-head">
        <h1>env.json</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE_ENV)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {input.trim() === '' ? null : result.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> ok
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div class="seg-ctrl">
          <button
            type="button"
            class={mode === 'toJson' ? 'on' : ''}
            onClick={() => setMode('toJson')}
          >
            .env → JSON
          </button>
          <button
            type="button"
            class={mode === 'toEnv' ? 'on' : ''}
            onClick={() => setMode('toEnv')}
          >
            JSON → .env
          </button>
        </div>
      </div>
      <p class="tool-sub">
        Handles quotes, comments, and export prefixes. No data leaves your browser.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'toJson' ? '.env in' : 'JSON in'}</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={
              mode === 'toJson'
                ? 'Paste .env content here…\n\ne.g. KEY=value'
                : 'Paste JSON object here…\n\ne.g. {"KEY":"value"}'
            }
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 320 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'toJson' ? 'JSON out' : '.env out'}</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                disabled={!result.ok}
                onClick={copy}
              >
                <Icon name="Copy" size={11} /> copy
              </button>
            </span>
          </div>
          {input.trim() === '' ? (
            <div class="tool-empty">Converted output appears here.</div>
          ) : result.ok ? (
            <textarea
              readOnly
              class="area bare"
              value={result.value}
              spellcheck={false}
              style={{ minHeight: 320 }}
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
