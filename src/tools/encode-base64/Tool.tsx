/**
 * encode.base64 — Base64 encode / decode with URL-safe variant.
 *
 * Two operating modes — encode (text → base64) and decode (base64
 * → text) — toggled by a segmented header control. The URL-safe
 * sub-toggle swaps `+/=` for `-_` (and strips padding on encode)
 * per RFC 4648 §5.
 *
 * Decoder is tolerant: it accepts both standard and URL-safe
 * inputs, re-pads as needed, and surfaces a clear error chip when
 * the payload is malformed. Encoding handles full UTF-8 via
 * TextEncoder so emoji and CJK round-trip correctly.
 *
 * Input persists via useToolInput so a refresh keeps your payload.
 * Aliases /encode/base64-encode and /encode/base64-decode seed the
 * mode for direct linking.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'

type Mode = 'encode' | 'decode'

const SAMPLE_ENCODE =
  'The quick brown fox jumps over the lazy dog.\nLocal-only. No data leaves your browser.'

export default function Tool({ initialState }: ToolProps) {
  const seededMode: Mode =
    initialState?.mode === 'decode' ? 'decode' : 'encode'

  const [mode, setMode] = useSeededState<Mode>(seededMode)
  const [urlSafe, setUrlSafe] = useSeededState<boolean>(false)
  const [input, setInput] = useToolInput('encode.base64', '')

  const isEmpty = input === ''

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: '' }
    try {
      const value = mode === 'encode' ? encode(input, urlSafe) : decode(input, urlSafe)
      return { ok: true as const, value }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, mode, urlSafe])

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
        <h1>base64</h1>
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
        <button
          type="button"
          class="btn"
          onClick={() => setUrlSafe((u) => !u)}
          aria-pressed={urlSafe}
        >
          <Icon name={urlSafe ? 'Check' : 'Plus'} size={11} />
          url-safe
        </button>
      </div>
      <p class="tool-sub">
        Standard or URL-safe (RFC 4648 §5). UTF-8 input round-trips through emoji and CJK.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'text in' : 'base64 in'}</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={mode === 'encode' ? 'Paste text to encode…' : 'Paste Base64 to decode…'}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 280 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>{mode === 'encode' ? 'base64 out' : 'text out'}</span>
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
              {mode === 'encode' ? 'Base64 output appears here.' : 'Decoded text appears here.'}
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

function encode(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  const std = typeof btoa !== 'undefined' ? btoa(bin) : ''
  if (!urlSafe) return std
  return std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decode(input: string, urlSafe: boolean): string {
  // Accept both alphabets regardless of toggle; the toggle only
  // affects encode output. Strip whitespace from copy-pasted blobs.
  let s = input.replace(/\s+/g, '')
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  // Re-pad to multiple of 4.
  const pad = (4 - (s.length % 4)) % 4
  s += '='.repeat(pad)
  void urlSafe
  const bin = typeof atob !== 'undefined' ? atob(s) : ''
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function byteLength(s: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length
  return s.length
}
