/**
 * inspect.color — color converter.
 *
 * One input field accepts a color in any supported notation (hex,
 * rgb()/rgba(), hsl()/hsla()); the pure engine parses it to a
 * canonical Rgba and the Tool re-derives the hex / rgb / hsl
 * representations on every keystroke. A live swatch previews the
 * parsed color via an inline backgroundColor.
 *
 * Each output row is independently copyable. When the input doesn't
 * parse, the header shows a `chip bad` and the outputs are replaced
 * by the parse error.
 *
 * Input persists via useToolInput so a refresh keeps your color.
 */

import { useMemo, useState } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { parseColor, toHex, toHslString, toRgbString } from './engine'

const SAMPLE = '#3b82f6'

export default function Tool({ initialState }: ToolProps) {
  const seeded = typeof initialState?.input === 'string' ? initialState.input : ''
  const [input, setInput] = useToolInput('inspect.color', seeded)
  const [copied, setCopied] = useState<string | null>(null)

  const isEmpty = input.trim() === ''

  const result = useMemo(() => {
    if (isEmpty) return { ok: true as const, hex: '', rgb: '', hsl: '', css: '' }
    try {
      const rgba = parseColor(input)
      return {
        ok: true as const,
        hex: toHex(rgba),
        rgb: toRgbString(rgba),
        hsl: toHslString(rgba),
        css: toRgbString(rgba),
      }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, isEmpty])

  const copy = (text: string, key: string) => {
    if (copyText(text)) {
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 900)
    }
  }

  const rows: { key: string; label: string; value: string }[] =
    result.ok && !isEmpty
      ? [
          { key: 'hex', label: 'hex', value: result.hex },
          { key: 'rgb', label: 'rgb', value: result.rgb },
          { key: 'hsl', label: 'hsl', value: result.hsl },
        ]
      : []

  return (
    <>
      <div class="tool-head">
        <h1>color.convert</h1>
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
      </div>
      <p class="tool-sub">
        Paste a color in any notation — hex, rgb(), or hsl(). Converts live. No
        data leaves your browser.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          {!isEmpty && (
            <div
              aria-label="color preview"
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                flex: '0 0 auto',
                border: '1px solid var(--line)',
                backgroundColor: result.ok && result.css ? result.css : 'transparent',
              }}
            />
          )}
          <input
            class="input"
            type="text"
            placeholder="#3b82f6 / rgb(59,130,246) / hsl(217,91%,60%)"
            value={input}
            style={{ flex: 1 }}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            spellcheck={false}
          />
          <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
            clear
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>output</span>
        </div>
        <div
          class="panel-b"
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {isEmpty ? (
            <div class="tool-empty">Converted values appear here.</div>
          ) : result.ok ? (
            rows.map((row) => (
              <div
                key={row.key}
                class="hash-row"
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{ color: 'var(--muted)', minWidth: 36 }}>
                  {row.label}
                </span>
                <code style={{ flex: 1, wordBreak: 'break-all' }}>
                  {row.value}
                </code>
                <button
                  class="btn ghost sm"
                  type="button"
                  onClick={() => copy(row.value, row.key)}
                >
                  <Icon name={copied === row.key ? 'Check' : 'Copy'} size={11} />
                </button>
              </div>
            ))
          ) : (
            <div class="json-error">{result.error}</div>
          )}
        </div>
      </div>
    </>
  )
}
