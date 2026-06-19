/**
 * encode.base — integer base / radix converter.
 *
 * One integer input plus a source-base picker (bin / oct / dec / hex
 * or auto, which reads a 0x/0b/0o prefix). The parsed value is shown
 * simultaneously in all four common bases — each row independently
 * copyable — and in an arbitrary target base (2..36) chosen with a
 * number field.
 *
 * Everything runs through the BigInt engine, so a 100-digit input
 * converts losslessly. Invalid digits for the chosen base surface a
 * `chip bad` and an error block instead of a wrong answer.
 *
 * Input persists via useToolInput so a refresh keeps your value.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { MAX_BASE, MIN_BASE, parseInBase, toBase, type FromBase } from './engine'

const SAMPLE = '255'

const FROM_OPTIONS: { value: FromBase; label: string }[] = [
  { value: 'auto', label: 'auto' },
  { value: 2, label: 'bin' },
  { value: 8, label: 'oct' },
  { value: 10, label: 'dec' },
  { value: 16, label: 'hex' },
]

const OUT_BASES: { base: number; name: string }[] = [
  { base: 2, name: 'bin' },
  { base: 8, name: 'oct' },
  { base: 10, name: 'dec' },
  { base: 16, name: 'hex' },
]

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, Math.floor(n)))
}

export default function Tool({ initialState }: ToolProps) {
  const seededInput =
    typeof initialState?.input === 'string' ? initialState.input : SAMPLE

  const [input, setInput] = useToolInput('encode.base', seededInput)
  const [from, setFrom] = useSeededState<FromBase>('auto')
  const [target, setTarget] = useSeededState<number>(36)

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: 0n, empty: true }
    try {
      return { ok: true as const, value: parseInBase(input, from), empty: false }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input, from])

  const copy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>base.convert</h1>
        {result.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> ok
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ color: 'var(--muted)' }}>from</span>
        <div class="seg-ctrl">
          {FROM_OPTIONS.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              class={from === o.value ? 'on' : ''}
              onClick={() => setFrom(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <p class="tool-sub">
        Arbitrary-precision via BigInt. Auto reads a 0x / 0b / 0o prefix; any
        base 2-36 is supported.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>integer in</span>
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
        <div class="panel-b">
          <input
            class="input"
            type="text"
            value={input}
            placeholder="e.g. 255, 0xff, 0b1010"
            spellcheck={false}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {result.ok ? (
        <>
          <div class="panel" style={{ marginBottom: 14 }}>
            <div class="panel-h">
              <span>output</span>
            </div>
            <div class="panel-b">
              {OUT_BASES.map(({ base, name }) => {
                const text = result.empty ? '' : toBase(result.value, base)
                return (
                  <div key={base} class="hash-row">
                    <span class="h-name">{name}</span>
                    <code style={{ wordBreak: 'break-all' }}>{text}</code>
                    <button
                      class="btn ghost sm"
                      type="button"
                      disabled={!text}
                      onClick={() => copy(text)}
                    >
                      <Icon name="Copy" size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div class="panel">
            <div class="panel-h">
              <span>target base</span>
            </div>
            <div class="panel-b">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--muted)' }}>base</span>
                <input
                  class="input"
                  type="number"
                  min={MIN_BASE}
                  max={MAX_BASE}
                  value={target}
                  style={{ width: 84 }}
                  onInput={(e) =>
                    setTarget(
                      clampInt(
                        (e.target as HTMLInputElement).valueAsNumber,
                        MIN_BASE,
                        MAX_BASE,
                      ),
                    )
                  }
                />
                <code style={{ flex: 1, wordBreak: 'break-all' }}>
                  {result.empty ? '' : toBase(result.value, target)}
                </code>
                <button
                  class="btn ghost sm"
                  type="button"
                  disabled={result.empty}
                  onClick={() => copy(toBase(result.value, target))}
                >
                  <Icon name="Copy" size={11} /> copy
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div class="panel">
          <div style={{ padding: 14 }}>
            <div class="json-error">{result.error}</div>
          </div>
        </div>
      )}
    </>
  )
}
