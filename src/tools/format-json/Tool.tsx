/**
 * format.json — JSON formatter, minifier, and validator.
 *
 * Two-pane layout: editable input on the left, formatted output
 * on the right (or an error block when the input doesn't parse).
 * The Tool re-validates on every keystroke; `JSON.parse` is fast
 * enough at the input cap (256 KB per useToolInput) that this
 * does not need debouncing.
 *
 * Indent control is segmented: minify (no whitespace), 2sp, 4sp,
 * tab. `sortKeys` recursively reorders object keys lexicographically
 * (arrays preserve order). Stats row reports node count, key count,
 * tree depth, and input → output byte change.
 *
 * `initialState.mode === 'minify'` (set by the /format/json-minify
 * alias) seeds the indent to 0 so the alias URL behaves as
 * advertised. The setting is treated as a one-shot seed: changing
 * the indent control after load doesn't fight the alias.
 *
 * Input persists through useToolInput so a reload keeps your
 * payload (sessionStorage by default, localStorage when the user
 * has opted into rememberInputs).
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from './use-seeded-state'

const SAMPLE_JSON = `{"id":"u_8421","name":"Ada","email":"ada@blutils.dev","plan":"pro","since":"2024-08-14","tags":["beta","admin"],"meta":{"twoFA":true,"lastLogin":1747800000,"devices":[{"os":"macOS","ver":"15.4"},{"os":"iOS","ver":"18.4"}]}}`

type Indent = 0 | 2 | 4 | '\t'

export default function Tool({ initialState }: ToolProps) {
  const [input, setInput] = useToolInput('format.json', SAMPLE_JSON)

  const seededIndent: Indent =
    initialState && initialState.mode === 'minify' ? 0 : 2

  const [indent, setIndent] = useSeededState<Indent>(seededIndent)
  const [sortKeys, setSortKeys] = useSeededState<boolean>(false)

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(input) as unknown }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input])

  const output = useMemo(() => {
    if (!parsed.ok) return ''
    const v = sortKeys ? sortRecursive(parsed.value) : parsed.value
    return indent === 0 ? JSON.stringify(v) : JSON.stringify(v, null, indent)
  }, [parsed, indent, sortKeys])

  const stats = useMemo(() => {
    if (!parsed.ok) return null
    return computeStats(parsed.value, input, output)
  }, [parsed, input, output])

  const copyOutput = () => {
    if (!parsed.ok) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(output).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>json.format</h1>
        {parsed.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> valid
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
            class={indent === 0 ? 'on' : ''}
            onClick={() => setIndent(0)}
          >
            minify
          </button>
          <button
            type="button"
            class={indent === 2 ? 'on' : ''}
            onClick={() => setIndent(2)}
          >
            2sp
          </button>
          <button
            type="button"
            class={indent === 4 ? 'on' : ''}
            onClick={() => setIndent(4)}
          >
            4sp
          </button>
          <button
            type="button"
            class={indent === '\t' ? 'on' : ''}
            onClick={() => setIndent('\t')}
          >
            tab
          </button>
        </div>
        <button
          type="button"
          class="btn"
          onClick={() => setSortKeys((s) => !s)}
          aria-pressed={sortKeys}
        >
          <Icon name={sortKeys ? 'Check' : 'Plus'} size={11} />
          sort keys
        </button>
      </div>
      <p class="tool-sub">
        Validates on every keystroke. Reformats live. No data leaves your browser.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>input</span>
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
            <span>output</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                disabled={!parsed.ok}
                onClick={copyOutput}
              >
                <Icon name="Copy" size={11} /> copy
              </button>
            </span>
          </div>
          {parsed.ok ? (
            <textarea
              readOnly
              class="area bare"
              value={output}
              spellcheck={false}
              style={{ minHeight: 360 }}
            />
          ) : (
            <div style={{ padding: 14 }}>
              <div class="json-error">{parsed.error}</div>
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div class="json-stats" style={{ marginTop: 12 }}>
          <span class="chip">{stats.nodes} nodes</span>
          <span class="chip">{stats.keys} keys</span>
          <span class="chip">depth {stats.depth}</span>
          <span class="chip">
            {stats.inBytes} → {stats.outBytes} B
          </span>
        </div>
      )}
    </>
  )
}

function sortRecursive(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(sortRecursive)
  if (x && typeof x === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(x as Record<string, unknown>).sort()) {
      out[k] = sortRecursive((x as Record<string, unknown>)[k])
    }
    return out
  }
  return x
}

interface Stats {
  nodes: number
  keys: number
  depth: number
  inBytes: number
  outBytes: number
}

function computeStats(value: unknown, input: string, output: string): Stats {
  let nodes = 0
  let keys = 0
  let depth = 0
  const walk = (v: unknown, d = 1): void => {
    nodes++
    if (d > depth) depth = d
    if (Array.isArray(v)) {
      for (const item of v) walk(item, d + 1)
    } else if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>
      const k = Object.keys(obj)
      keys += k.length
      for (const key of k) walk(obj[key], d + 1)
    }
  }
  walk(value)
  return {
    nodes,
    keys,
    depth,
    inBytes: byteLength(input),
    outBytes: byteLength(output),
  }
}

function byteLength(s: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length
  // SSR / no-TextEncoder fallback — close enough for stats display.
  return s.length
}
