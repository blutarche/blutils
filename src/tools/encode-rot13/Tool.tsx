/**
 * encode.rot13 — ROT13 / Caesar letter-rotation cipher.
 *
 * A single shift control (number field + range slider) drives a live
 * transform of the input. The "ROT13" preset snaps the shift to 13,
 * the self-inverse rotation. Only ASCII letters rotate; case is
 * preserved and everything else passes through (see engine.ts).
 *
 * The cipher is symmetric: decoding is just another Caesar shift of
 * `26 - shift`, surfaced as a hint under the controls so the same
 * Tool both encodes and decodes.
 *
 * Input persists via useToolInput; the shift is transient UI state.
 */

import { useMemo } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { caesar } from './engine'

const SAMPLE = 'The quick brown fox jumps over the lazy dog.'

function clampShift(n: number): number {
  if (!Number.isFinite(n)) return 0
  // Keep the visible control in [0, 25]; the engine normalises anyway.
  return ((Math.trunc(n) % 26) + 26) % 26
}

export default function Tool() {
  const [input, setInput] = useToolInput('encode.rot13', SAMPLE)
  const [shift, setShift] = useSeededState<number>(13)

  const output = useMemo(() => caesar(input, shift), [input, shift])
  const decodeShift = (26 - shift) % 26

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(output).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>rot13.caesar</h1>
        <span class="chip">shift {shift}</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          class={'btn' + (shift === 13 ? ' on' : '')}
          onClick={() => setShift(13)}
          aria-pressed={shift === 13}
        >
          <Icon name="RotateCw" size={11} />
          ROT13
        </button>
      </div>
      <p class="tool-sub">
        Rotates A-Z / a-z by the shift; case preserved, everything else
        untouched. To decode, shift by {decodeShift}. No data leaves your
        browser.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <span style={{ color: 'var(--muted)' }}>shift</span>
          <input
            class="input"
            type="number"
            min={0}
            max={25}
            value={shift}
            style={{ width: 84 }}
            onInput={(e) =>
              setShift(clampShift((e.target as HTMLInputElement).valueAsNumber))
            }
          />
          <input
            type="range"
            min={0}
            max={25}
            value={shift}
            style={{ flex: 1, minWidth: 120 }}
            onInput={(e) =>
              setShift(parseInt((e.target as HTMLInputElement).value, 10))
            }
          />
        </div>
      </div>

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
                onClick={() => setInput(SAMPLE)}
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
            style={{ minHeight: 280 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>output</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={copy}>
                <Icon name="Copy" size={11} /> copy
              </button>
            </span>
          </div>
          <textarea
            readOnly
            class="area bare"
            value={output}
            spellcheck={false}
            style={{ minHeight: 280 }}
          />
        </div>
      </div>
    </>
  )
}
