/**
 * inspect.url — URL component parser.
 *
 * A single input ("https://user:pass@host:port/path?query#hash")
 * feeds the pure `parseUrl` engine on every keystroke. A valid parse
 * fills a copyable .kv grid of the URL's components, plus a second
 * .kv grid of decoded query params (one row per pair, duplicate keys
 * kept in order). An invalid parse swaps the ok chip for a bad chip
 * and shows the engine's error inline.
 *
 * Each value row has a copy button so a single component — a host, a
 * query value — can be lifted out without selecting text. The input
 * persists via useToolInput so a reload keeps the block.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { parseUrl } from './engine'

const SAMPLE = 'https://user:pass@example.com:8443/a/b?x=1&y=2&x=3#frag'

export default function Tool({ initialState }: ToolProps) {
  const seed =
    typeof initialState?.input === 'string' ? initialState.input : SAMPLE
  const [input, setInput] = useToolInput('inspect.url', seed)

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: parseUrl(input) }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input])

  const copy = (s: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(s).catch(() => {})
    }
  }

  const rows: Array<{ label: string; value: string }> = parsed.ok
    ? [
        { label: 'protocol', value: parsed.value.protocol },
        { label: 'username', value: parsed.value.username },
        { label: 'password', value: parsed.value.password },
        { label: 'origin', value: parsed.value.origin },
        { label: 'host', value: parsed.value.host },
        { label: 'hostname', value: parsed.value.hostname },
        { label: 'port', value: parsed.value.port },
        { label: 'pathname', value: parsed.value.pathname },
        { label: 'search', value: parsed.value.search },
        { label: 'hash', value: parsed.value.hash },
      ].filter((r) => r.value !== '')
    : []

  const params = parsed.ok ? parsed.value.params : []

  return (
    <>
      <div class="tool-head">
        <h1>url.parse</h1>
        {parsed.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> valid
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        )}
        {parsed.ok && (
          <span class="chip">
            {params.length} {params.length === 1 ? 'param' : 'params'}
          </span>
        )}
      </div>
      <p class="tool-sub">
        Breaks a URL into its components. Query params are decoded; duplicate
        keys are kept in order.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>url</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
              clear
            </button>
            <button class="btn ghost sm" type="button" onClick={() => setInput(SAMPLE)}>
              sample
            </button>
          </span>
        </div>
        <div class="panel-b">
          <input
            class="input"
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            spellcheck={false}
            placeholder="https://example.com/path?key=value"
          />
        </div>
      </div>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>components</span>
        </div>
        <div class="panel-b">
          {parsed.ok ? (
            <dl class="kv" style={{ gridTemplateColumns: '110px 1fr auto' }}>
              {rows.map((r) => (
                <>
                  <dt key={`dt-${r.label}`}>{r.label}</dt>
                  <dd
                    key={`dd-${r.label}`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {r.value}
                  </dd>
                  <dd key={`cp-${r.label}`} style={{ textAlign: 'right' }}>
                    <button
                      class="btn ghost sm"
                      type="button"
                      onClick={() => copy(r.value)}
                    >
                      <Icon name="Copy" size={11} />
                    </button>
                  </dd>
                </>
              ))}
            </dl>
          ) : (
            <div class="json-error">{parsed.error}</div>
          )}
        </div>
      </div>

      {parsed.ok && (
        <div class="panel">
          <div class="panel-h">
            <span>query params</span>
          </div>
          <div class="panel-b">
            {params.length > 0 ? (
              <dl class="kv" style={{ gridTemplateColumns: '110px 1fr auto' }}>
                {params.map(([key, value], i) => (
                  <>
                    <dt
                      key={`dt-${i}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {key}
                    </dt>
                    <dd
                      key={`dd-${i}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {value}
                    </dd>
                    <dd key={`cp-${i}`} style={{ textAlign: 'right' }}>
                      <button
                        class="btn ghost sm"
                        type="button"
                        onClick={() => copy(value)}
                      >
                        <Icon name="Copy" size={11} />
                      </button>
                    </dd>
                  </>
                ))}
              </dl>
            ) : (
              <p class="tool-sub" style={{ margin: 0 }}>
                No query string.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
