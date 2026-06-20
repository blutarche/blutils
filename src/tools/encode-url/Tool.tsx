/**
 * encode.url — URL percent-encode / decode.
 *
 * Two operating modes — encode (text → %XX) and decode (%XX → text)
 * — toggled by a segmented header control. A second segmented
 * control picks the variant: "component" wraps
 * encodeURIComponent/decodeURIComponent (escapes the reserved set,
 * safe for one query value or path segment) and "uri" wraps
 * encodeURI/decodeURI (leaves reserved chars intact, keeps a whole
 * URL usable).
 *
 * Decoding surfaces a clear error chip when the payload has a
 * malformed percent sequence (decodeURIComponent throws URIError on
 * a truncated or invalid escape). Encoding never fails.
 *
 * Input persists via useToolInput so a refresh keeps your payload.
 * Aliases /encode/url-encode and /encode/url-decode seed the mode
 * for direct linking.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { decode, encode, type Variant } from './engine'

type Mode = 'encode' | 'decode'

const SAMPLE_ENCODE = 'name=Ada Lovelace & role=author? café 😀'

export default function Tool({ initialState }: ToolProps) {
  const seededMode: Mode =
    initialState?.mode === 'decode' ? 'decode' : 'encode'

  const [mode, setMode] = useSeededState<Mode>(seededMode)
  const [variant, setVariant] = useSeededState<Variant>('component')
  const [input, setInput] = useToolInput('encode.url', '')

  const isEmpty = input === ''

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: '' }
    if (mode === 'encode') {
      return { ok: true as const, value: encode(input, variant) }
    }
    const r = decode(input, variant)
    return r.ok
      ? { ok: true as const, value: r.value }
      : { ok: false as const, error: r.error }
  }, [input, mode, variant])

  const inputBytes = useMemo(() => byteLength(input), [input])
  const outputBytes = useMemo(
    () => (result.ok ? byteLength(result.value) : 0),
    [result],
  )

  const copy = () => {
    if (!result.ok) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result.value).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>url</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE_ENCODE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {isEmpty ? null : result.ok ? (
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
            class={mode === 'encode' ? 'on' : ''}
            onClick={() => setMode('encode')}
          >
            encode
          </button>
          <button
            type="button"
            class={mode === 'decode' ? 'on' : ''}
            onClick={() => setMode('decode')}
          >
            decode
          </button>
        </div>
        <div class="seg-ctrl">
          <button
            type="button"
            class={variant === 'component' ? 'on' : ''}
            onClick={() => setVariant('component')}
          >
            component
          </button>
          <button
            type="button"
            class={variant === 'uri' ? 'on' : ''}
            onClick={() => setVariant('uri')}
          >
            full uri
          </button>
        </div>
      </div>
      <p class="tool-sub">
        Component escapes reserved chars (?&=#) for one query value; full URI
        keeps a whole URL intact. UTF-8 round-trips through emoji and CJK.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'text in' : 'encoded in'}</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={mode === 'encode' ? 'Paste text to percent-encode…' : 'Paste encoded URL to decode…'}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 280 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'encoded out' : 'text out'}</span>
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
          {isEmpty ? (
            <div class="tool-empty">
              {mode === 'encode' ? 'Encoded output appears here.' : 'Decoded text appears here.'}
            </div>
          ) : result.ok ? (
            <textarea
              readOnly
              class="area bare"
              value={result.value}
              spellcheck={false}
              style={{ minHeight: 280 }}
            />
          ) : (
            <div style={{ padding: 14 }}>
              <div class="json-error">{result.error}</div>
            </div>
          )}
        </div>
      </div>

      <div class="json-stats" style={{ marginTop: 12 }}>
        <span class="chip">{inputBytes} B in</span>
        <span class="chip">{outputBytes} B out</span>
      </div>
    </>
  )
}

function byteLength(s: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length
  return s.length
}
