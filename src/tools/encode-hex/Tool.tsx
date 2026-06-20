/**
 * encode.hex — text ↔ hex with a live hexdump view.
 *
 * Two operating modes — text → hex and hex → text — toggled by a
 * segmented header control. In text → hex mode an uppercase toggle
 * and a space-delimiter toggle shape the output; in hex → text mode
 * the decoder tolerates whitespace and surfaces an error chip on
 * malformed input.
 *
 * Below the panes sits a classic hexdump of whatever the *text*
 * currently is (the decoded text when decoding, the raw input when
 * encoding), so you always see the byte layout of real text.
 *
 * Pure byte logic lives in engine.ts and is unit-tested there; this
 * component is a thin UI shell. Input persists via useToolInput.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { hexToText, hexdump, textToHex } from './engine'

type Mode = 'encode' | 'decode'

const SAMPLE = 'Hello, hex! 👋'

export default function Tool({ initialState }: ToolProps) {
  const seededMode: Mode = initialState?.mode === 'decode' ? 'decode' : 'encode'

  const [mode, setMode] = useSeededState<Mode>(seededMode)
  const [upper, setUpper] = useSeededState<boolean>(false)
  const [delimited, setDelimited] = useSeededState<boolean>(false)
  const [input, setInput] = useToolInput('encode.hex', '')

  const isEmpty = input === ''

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: '', text: '' }
    try {
      if (mode === 'encode') {
        const value = textToHex(input, {
          upper,
          delimiter: delimited ? ' ' : '',
        })
        return { ok: true as const, value, text: input }
      }
      const text = hexToText(input)
      return { ok: true as const, value: text, text }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, mode, upper, delimited])

  const dump = useMemo(
    () => (result.ok ? hexdump(result.text) : ''),
    [result],
  )

  const copy = () => {
    if (!result.ok) return
    copyText(result.value)
  }

  return (
    <>
      <div class="tool-head">
        <h1>hex</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
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
            text → hex
          </button>
          <button
            type="button"
            class={mode === 'decode' ? 'on' : ''}
            onClick={() => setMode('decode')}
          >
            hex → text
          </button>
        </div>
        {mode === 'encode' && (
          <>
            <button
              type="button"
              class="btn"
              onClick={() => setUpper((u) => !u)}
              aria-pressed={upper}
            >
              <Icon name={upper ? 'Check' : 'Plus'} size={11} />
              uppercase
            </button>
            <button
              type="button"
              class="btn"
              onClick={() => setDelimited((d) => !d)}
              aria-pressed={delimited}
            >
              <Icon name={delimited ? 'Check' : 'Plus'} size={11} />
              spaced
            </button>
          </>
        )}
      </div>
      <p class="tool-sub">
        UTF-8 bytes as hexadecimal, both ways. The hexdump below mirrors the
        decoded text.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'text in' : 'hex in'}</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => setInput('')}
              >
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={mode === 'encode' ? 'Paste text to convert to hex…' : 'Paste hex to decode…'}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 280 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'hex out' : 'text out'}</span>
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
              {mode === 'encode' ? 'Hex output appears here.' : 'Decoded text appears here.'}
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

      <div class="panel" style={{ marginTop: 12 }}>
        <div class="panel-h">
          <span>hexdump</span>
        </div>
        {isEmpty ? (
          <div class="tool-empty">Hexdump appears here.</div>
        ) : (
          <textarea
            readOnly
            class="area bare"
            value={dump}
            spellcheck={false}
            style={{ minHeight: 160 }}
          />
        )}
      </div>
    </>
  )
}
