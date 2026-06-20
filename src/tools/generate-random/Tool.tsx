/**
 * generate.random — random string / token generator.
 *
 * Charset is built from toggled named sets (lower/upper/digits/
 * symbols) with an optional "exclude ambiguous" pass, or replaced
 * wholesale by a custom alphabet. Bytes come from the Web Crypto
 * CSPRNG via the pure engine, which rejection-samples to stay
 * unbiased and chunks draws under the getRandomValues quota.
 *
 * Only the *options* persist (via useToolInput, JSON-encoded).
 * Generated output is intentionally never written to storage — a
 * token is secret-ish and shouldn't linger in localStorage.
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import {
  buildAlphabet,
  type CharsetKey,
  cryptoU32Source,
  entropyBits,
  randomStrings,
  toAlphabet,
} from './engine'

interface Opts {
  length: number
  count: number
  sets: CharsetKey[]
  excludeAmbiguous: boolean
  custom: string
}

const DEFAULTS: Opts = {
  length: 32,
  count: 1,
  sets: ['lowercase', 'uppercase', 'digits'],
  excludeAmbiguous: false,
  custom: '',
}

const SET_LABELS: Record<CharsetKey, string> = {
  lowercase: 'a-z',
  uppercase: 'A-Z',
  digits: '0-9',
  symbols: '!@#',
}

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, Math.floor(n)))
}

export default function Tool() {
  const [raw, setRaw] = useToolInput('generate.random', JSON.stringify(DEFAULTS))
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

  const toggleSet = (k: CharsetKey) => {
    const has = opts.sets.includes(k)
    update({ sets: has ? opts.sets.filter((s) => s !== k) : [...opts.sets, k] })
  }

  const alphabet = useMemo(() => {
    const custom = opts.custom.trim()
    return custom
      ? toAlphabet(custom)
      : buildAlphabet({ sets: opts.sets, excludeAmbiguous: opts.excludeAmbiguous })
  }, [opts.custom, opts.sets, opts.excludeAmbiguous])

  const valid = alphabet.length >= 2
  const bits = entropyBits(opts.length, alphabet.length)

  const lines = useMemo(() => {
    void seed // bump to regenerate without changing options
    if (!valid) return []
    const next = cryptoU32Source()
    return randomStrings(opts.count, opts.length, alphabet, next)
  }, [alphabet, opts.count, opts.length, seed, valid])

  const copy = (text: string, idx: number) => {
    if (copyText(text)) {
      setCopied(idx)
      setTimeout(() => setCopied((c) => (c === idx ? null : c)), 900)
    }
  }

  const usingCustom = opts.custom.trim().length > 0

  return (
    <>
      <div class="tool-head">
        <h1>random.string</h1>
        {valid ? (
          <span class="chip">~{bits} bits</span>
        ) : (
          <span class="chip bad">empty charset</span>
        )}
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
        Cryptographically random strings from a charset you choose. Generated
        locally; never stored or sent.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)' }}>length</span>
            <input
              class="input"
              type="number"
              min={1}
              max={4096}
              value={opts.length}
              style={{ width: 84 }}
              onInput={(e) =>
                update({
                  length: clampInt(
                    (e.target as HTMLInputElement).valueAsNumber,
                    1,
                    4096,
                  ),
                })
              }
            />
            <input
              type="range"
              min={1}
              max={128}
              value={Math.min(opts.length, 128)}
              style={{ flex: 1, minWidth: 120 }}
              onInput={(e) =>
                update({
                  length: parseInt((e.target as HTMLInputElement).value, 10),
                })
              }
            />
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
                onClick={() => update({ count: Math.min(100, opts.count + 1) })}
              >
                <Icon name="Plus" size={10} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)' }}>charset</span>
            <div class="seg-ctrl">
              {(Object.keys(SET_LABELS) as CharsetKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  class={!usingCustom && opts.sets.includes(k) ? 'on' : ''}
                  disabled={usingCustom}
                  onClick={() => toggleSet(k)}
                >
                  {SET_LABELS[k]}
                </button>
              ))}
            </div>
            <button
              type="button"
              class={'btn ghost sm' + (opts.excludeAmbiguous ? ' on' : '')}
              disabled={usingCustom}
              onClick={() => update({ excludeAmbiguous: !opts.excludeAmbiguous })}
            >
              {opts.excludeAmbiguous ? (
                <Icon name="Check" size={11} />
              ) : (
                <Icon name="X" size={11} />
              )}{' '}
              exclude ambiguous
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--muted)' }}>custom</span>
            <input
              class="input"
              type="text"
              placeholder="override charset (optional)"
              value={opts.custom}
              style={{ flex: 1 }}
              onInput={(e) =>
                update({ custom: (e.target as HTMLInputElement).value })
              }
            />
          </div>
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
          {valid ? (
            lines.map((line, i) => (
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
            ))
          ) : (
            <span style={{ color: 'var(--muted)' }}>
              Select at least one charset, or enter a custom alphabet with 2+
              distinct characters.
            </span>
          )}
        </div>
      </div>
    </>
  )
}
