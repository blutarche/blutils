/**
 * encode.basex — Base32 / Base58 encode / decode.
 *
 * A scheme toggle (base32 / base58) and an encode/decode mode
 * segmented control select one of four pure codecs from engine.ts.
 * Base32 is RFC 4648 §6 (standard alphabet, '=' padding); Base58 is
 * the Bitcoin alphabet. Both round-trip full UTF-8 via TextEncoder /
 * TextDecoder, so emoji and CJK survive.
 *
 * Decoding is tolerant where the spec allows — Base32 accepts
 * lowercase and ignores whitespace / padding — and surfaces a clear
 * error chip on a malformed payload.
 *
 * Input persists via useToolInput so a refresh keeps your payload.
 * The /encode/base58 alias seeds the scheme for direct linking.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import {
  base32Decode,
  base32Encode,
  base58Decode,
  base58Encode,
} from './engine'

type Scheme = 'base32' | 'base58'
type Mode = 'encode' | 'decode'

const SAMPLE_ENCODE =
  'The quick brown fox jumps over the lazy dog.\nLocal-only. No data leaves your browser.'

export default function Tool({ initialState }: ToolProps) {
  const seededScheme: Scheme =
    initialState?.scheme === 'base58' ? 'base58' : 'base32'

  const [scheme, setScheme] = useSeededState<Scheme>(seededScheme)
  const [mode, setMode] = useSeededState<Mode>('encode')
  const [input, setInput] = useToolInput('encode.basex', '')

  const isEmpty = input === ''

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: '' }
    try {
      const value = run(scheme, mode, input)
      return { ok: true as const, value }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, scheme, mode])

  const inputBytes = useMemo(() => byteLength(input), [input])
  const outputBytes = useMemo(
    () => (result.ok ? byteLength(result.value) : 0),
    [result],
  )

  const copy = () => {
    if (!result.ok) return
    copyText(result.value)
  }

  return (
    <>
      <div class="tool-head">
        <h1>{scheme}</h1>
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
            class={scheme === 'base32' ? 'on' : ''}
            onClick={() => setScheme('base32')}
          >
            base32
          </button>
          <button
            type="button"
            class={scheme === 'base58' ? 'on' : ''}
            onClick={() => setScheme('base58')}
          >
            base58
          </button>
        </div>
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
      </div>
      <p class="tool-sub">
        Base32 is RFC 4648 §6; Base58 uses the Bitcoin alphabet. UTF-8 input
        round-trips through emoji and CJK.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'text in' : `${scheme} in`}</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={mode === 'encode' ? 'Paste text to encode…' : `Paste ${scheme} to decode…`}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 280 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? `${scheme} out` : 'text out'}</span>
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
              {mode === 'encode' ? `${scheme} output appears here.` : 'Decoded text appears here.'}
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

function run(scheme: Scheme, mode: Mode, input: string): string {
  if (scheme === 'base32') {
    return mode === 'encode' ? base32Encode(input) : base32Decode(input)
  }
  return mode === 'encode' ? base58Encode(input) : base58Decode(input)
}

function byteLength(s: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length
  return s.length
}
