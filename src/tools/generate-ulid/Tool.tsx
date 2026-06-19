/**
 * generate.ulid — sortable ULID generator.
 *
 * Each ULID is a 48-bit `Date.now()` timestamp plus 80 bits of Web
 * Crypto randomness, rendered as 26 uppercase Crockford base32 chars.
 * The timestamp is read here (at the edge) and passed into the pure
 * engine; the engine itself never touches a clock.
 *
 * A regenerate button bumps a seed so output reshuffles — and picks up
 * a fresh timestamp — without touching options. Only the *options*
 * persist (via useToolInput, JSON-encoded); generated ULIDs are never
 * written to storage.
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { ulids } from './engine'

interface Opts {
  count: number
}

const DEFAULTS: Opts = {
  count: 1,
}

const MAX_COUNT = 100

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, Math.floor(n)))
}

export default function Tool() {
  const [raw, setRaw] = useToolInput('generate.ulid', JSON.stringify(DEFAULTS))
  const [seed, setSeed] = useState(1)
  const [copied, setCopied] = useState<number | null>(null)

  const opts = useMemo<Opts>(() => {
    try {
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Opts>) }
    } catch {
      return DEFAULTS
    }
  }, [raw])

  const update = (patch: Partial<Opts>) =>
    setRaw(JSON.stringify({ ...opts, ...patch }))

  const lines = useMemo(() => {
    void seed // bump to regenerate (and re-timestamp) without changing options
    return ulids(opts.count, Date.now())
  }, [opts.count, seed])

  const copy = (text: string, idx: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopied(idx)
      setTimeout(() => setCopied((c) => (c === idx ? null : c)), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>generate.ulid</h1>
        <span class="chip">Crockford base32</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => setSeed((s) => s + 1)}
        >
          <Icon name="Dices" size={11} /> regenerate
        </button>
      </div>
      <p class="tool-sub">
        Sortable ULIDs — a millisecond timestamp plus browser CSPRNG
        randomness. Always 26 uppercase chars. Generated locally; never stored
        or sent.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <span style={{ color: 'var(--muted)' }}>count</span>
          <div class="seg-ctrl">
            <button
              type="button"
              onClick={() => update({ count: Math.max(1, opts.count - 1) })}
            >
              <Icon name="Minus" size={10} />
            </button>
            <button type="button" style={{ minWidth: 36 }} class="on">
              {opts.count}
            </button>
            <button
              type="button"
              onClick={() => update({ count: Math.min(MAX_COUNT, opts.count + 1) })}
            >
              <Icon name="Plus" size={10} />
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={MAX_COUNT}
            value={opts.count}
            onInput={(e) =>
              update({
                count: clampInt(
                  (e.target as HTMLInputElement).valueAsNumber,
                  1,
                  MAX_COUNT,
                ),
              })
            }
            style={{ flex: 1, minWidth: 120 }}
          />
        </div>
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>output</span>
          <span class="actions">
            {lines.length > 1 && (
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => copy(lines.join('\n'), -1)}
              >
                <Icon name={copied === -1 ? 'Check' : 'Copy'} size={11} /> copy all
              </button>
            )}
          </span>
        </div>
        <div class="panel-b" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lines.map((line, i) => (
            <div
              key={i}
              class="hash-row"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <code style={{ flex: 1, wordBreak: 'break-all' }}>{line}</code>
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => copy(line, i)}
              >
                <Icon name={copied === i ? 'Check' : 'Copy'} size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
