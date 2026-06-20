/**
 * encode.html — HTML-entity escape / unescape.
 *
 * Two operating modes — encode (text → entities) and decode
 * (entities → text) — toggled by a segmented header control.
 * Encode always escapes the five markup-significant characters
 * (`& < > " '`); an extra "non-ASCII → numeric" toggle additionally
 * converts every char above 0x7E to a decimal numeric entity, handy
 * for ASCII-only transports. Decode understands the core named set
 * plus numeric `&#nnn;` / `&#xHH;`; unknown entities pass through.
 *
 * All logic lives in ./engine (pure, DOM-free) so it round-trips and
 * tests without a document. Input persists via useToolInput so a
 * refresh keeps your payload. Aliases /encode/html-encode and
 * /encode/html-decode seed the mode for direct linking.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { decode, encode } from './engine'

type Mode = 'encode' | 'decode'

const SAMPLE_ENCODE =
  '<a href="/x?q=1&r=2">Tom & Jerry</a> — café 😀'

export default function Tool({ initialState }: ToolProps) {
  const seededMode: Mode =
    initialState?.mode === 'decode' ? 'decode' : 'encode'

  const [mode, setMode] = useSeededState<Mode>(seededMode)
  const [nonAscii, setNonAscii] = useSeededState<boolean>(false)
  const [input, setInput] = useToolInput('encode.html', '')

  const isEmpty = input === ''

  const result = useMemo(() => {
    if (!input) return { value: '' }
    const value =
      mode === 'encode' ? encode(input, { nonAscii }) : decode(input)
    return { value }
  }, [input, mode, nonAscii])

  const inputBytes = useMemo(() => byteLength(input), [input])
  const outputBytes = useMemo(() => byteLength(result.value), [result])

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result.value).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>html entities</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE_ENCODE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {isEmpty ? null : (
          <span class="chip ok">
            <Icon name="Check" size={11} /> ok
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
        {mode === 'encode' && (
          <button
            type="button"
            class="btn"
            onClick={() => setNonAscii((v) => !v)}
            aria-pressed={nonAscii}
          >
            <Icon name={nonAscii ? 'Check' : 'Plus'} size={11} />
            non-ascii → numeric
          </button>
        )}
      </div>
      <p class="tool-sub">
        Escapes &amp; &lt; &gt; &quot; ' to named entities; decode handles named
        and numeric (&amp;#nnn; / &amp;#xHH;). Non-ASCII toggle emits numeric
        entities for emoji and CJK.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'text in' : 'entities in'}</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={mode === 'encode' ? 'Paste text to escape…' : 'Paste HTML entities to decode…'}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 280 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'entities out' : 'text out'}</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={copy}>
                <Icon name="Copy" size={11} /> copy
              </button>
            </span>
          </div>
          {isEmpty ? (
            <div class="tool-empty">
              {mode === 'encode' ? 'Escaped HTML appears here.' : 'Decoded text appears here.'}
            </div>
          ) : (
            <textarea
              readOnly
              class="area bare"
              value={result.value}
              spellcheck={false}
              style={{ minHeight: 280 }}
            />
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
