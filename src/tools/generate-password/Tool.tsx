/**
 * generate.password — password / passphrase generator.
 *
 * Two modes share one CSPRNG path. Password mode builds an
 * alphabet from toggled named classes (lower/upper/digits/symbols)
 * with optional ambiguous-char exclusion and an optional
 * one-of-each-class guarantee. Passphrase mode picks words
 * uniformly from a bundled 256-word list (8 bits/word). Both draw
 * from Web Crypto via the pure engine, which rejection-samples to
 * stay unbiased and chunks draws under the getRandomValues quota.
 *
 * Only the *options* persist (via useToolInput, JSON-encoded). The
 * generated secret is intentionally never written to storage.
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import {
  buildClasses,
  combineClasses,
  type CharsetKey,
  cryptoU32Source,
  generatePassphrase,
  generatePassword,
  passphraseEntropyBits,
  passwordEntropyBits,
  passwordEntropyBitsWithClasses,
  strengthLabel,
  WORDLIST,
} from './engine'

type Mode = 'password' | 'passphrase'

interface Opts {
  mode: Mode
  // password
  length: number
  sets: CharsetKey[]
  excludeAmbiguous: boolean
  requireEachClass: boolean
  // passphrase
  words: number
  separator: string
  capitalize: boolean
  appendDigit: boolean
}

const DEFAULTS: Opts = {
  mode: 'password',
  length: 20,
  sets: ['lowercase', 'uppercase', 'digits', 'symbols'],
  excludeAmbiguous: false,
  requireEachClass: true,
  words: 6,
  separator: '-',
  capitalize: false,
  appendDigit: false,
}

const SET_LABELS: Record<CharsetKey, string> = {
  lowercase: 'a-z',
  uppercase: 'A-Z',
  digits: '0-9',
  symbols: '!@#',
}

const SEPARATORS: { value: string; label: string }[] = [
  { value: '-', label: '-' },
  { value: '_', label: '_' },
  { value: '.', label: '.' },
  { value: ' ', label: '␣' },
  { value: '', label: '∅' },
]

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, Math.floor(n)))
}

/** Chip variant from a coarse strength label. */
function chipVariant(label: string): string {
  if (label === 'very weak' || label === 'weak') return 'bad'
  if (label === 'fair') return 'info'
  return 'ok'
}

export default function Tool() {
  const [raw, setRaw] = useToolInput(
    'generate.password',
    JSON.stringify(DEFAULTS),
  )
  const [seed, setSeed] = useState(1)
  const [copied, setCopied] = useState(false)

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

  const classes = useMemo(
    () =>
      buildClasses({
        sets: opts.sets,
        excludeAmbiguous: opts.excludeAmbiguous,
      }),
    [opts.sets, opts.excludeAmbiguous],
  )

  const alphabetSize = useMemo(
    () => combineClasses(classes).length,
    [classes],
  )

  const valid =
    opts.mode === 'password' ? alphabetSize >= 2 : opts.words >= 1

  const bits =
    opts.mode === 'password'
      ? opts.requireEachClass && opts.length >= classes.length
        ? passwordEntropyBitsWithClasses(opts.length, classes)
        : passwordEntropyBits(opts.length, alphabetSize)
      : passphraseEntropyBits({
          words: opts.words,
          wordlistSize: WORDLIST.length,
          appendDigit: opts.appendDigit,
        })

  const label = strengthLabel(bits)

  const secret = useMemo(() => {
    void seed // bump to regenerate without changing options
    if (!valid) return ''
    const next = cryptoU32Source()
    try {
      if (opts.mode === 'password') {
        return generatePassword(
          {
            length: opts.length,
            classes,
            requireEachClass: opts.requireEachClass,
          },
          next,
        )
      }
      return generatePassphrase(
        {
          words: opts.words,
          wordlist: WORDLIST,
          separator: opts.separator,
          capitalize: opts.capitalize,
          appendDigit: opts.appendDigit,
        },
        next,
      )
    } catch {
      return ''
    }
  }, [
    seed,
    valid,
    opts.mode,
    opts.length,
    classes,
    opts.requireEachClass,
    opts.words,
    opts.separator,
    opts.capitalize,
    opts.appendDigit,
  ])

  const copy = () => {
    if (!secret) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(secret).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    }
  }

  // Guarantee can't apply when length < number of selected classes.
  const guaranteeImpossible =
    opts.requireEachClass && opts.length < classes.length

  return (
    <>
      <div class="tool-head">
        <h1>generate.password</h1>
        {valid ? (
          <span class={'chip ' + chipVariant(label)}>
            ~{bits} bits · {label}
          </span>
        ) : (
          <span class="chip bad">
            {opts.mode === 'password' ? 'empty charset' : 'no words'}
          </span>
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
        Strong passwords and diceware-style passphrases from the browser
        CSPRNG. Generated locally; never stored or sent.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--muted)' }}>mode</span>
            <div class="seg-ctrl">
              <button
                type="button"
                class={opts.mode === 'password' ? 'on' : ''}
                onClick={() => update({ mode: 'password' })}
              >
                password
              </button>
              <button
                type="button"
                class={opts.mode === 'passphrase' ? 'on' : ''}
                onClick={() => update({ mode: 'passphrase' })}
              >
                passphrase
              </button>
            </div>
          </div>

          {opts.mode === 'password' ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--muted)' }}>length</span>
                <input
                  class="input"
                  type="number"
                  min={1}
                  max={256}
                  value={opts.length}
                  style={{ width: 84 }}
                  onInput={(e) =>
                    update({
                      length: clampInt(
                        (e.target as HTMLInputElement).valueAsNumber,
                        1,
                        256,
                      ),
                    })
                  }
                />
                <input
                  type="range"
                  min={4}
                  max={64}
                  value={Math.min(Math.max(opts.length, 4), 64)}
                  style={{ flex: 1, minWidth: 120 }}
                  onInput={(e) =>
                    update({
                      length: parseInt((e.target as HTMLInputElement).value, 10),
                    })
                  }
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--muted)' }}>charset</span>
                <div class="seg-ctrl">
                  {(Object.keys(SET_LABELS) as CharsetKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      class={opts.sets.includes(k) ? 'on' : ''}
                      onClick={() => toggleSet(k)}
                    >
                      {SET_LABELS[k]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  class={
                    'btn ghost sm' + (opts.excludeAmbiguous ? ' on' : '')
                  }
                  onClick={() =>
                    update({ excludeAmbiguous: !opts.excludeAmbiguous })
                  }
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
                <button
                  type="button"
                  class={
                    'btn ghost sm' + (opts.requireEachClass ? ' on' : '')
                  }
                  onClick={() =>
                    update({ requireEachClass: !opts.requireEachClass })
                  }
                >
                  {opts.requireEachClass ? (
                    <Icon name="Check" size={11} />
                  ) : (
                    <Icon name="X" size={11} />
                  )}{' '}
                  one of each class
                </button>
                {guaranteeImpossible && (
                  <span class="chip info">length &lt; classes</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--muted)' }}>words</span>
                <div class="seg-ctrl">
                  <button
                    type="button"
                    onClick={() =>
                      update({ words: Math.max(1, opts.words - 1) })
                    }
                  >
                    <Icon name="Minus" size={10} />
                  </button>
                  <button type="button" style={{ minWidth: 36 }} class="on">
                    {opts.words}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update({ words: Math.min(24, opts.words + 1) })
                    }
                  >
                    <Icon name="Plus" size={10} />
                  </button>
                </div>
                <span style={{ color: 'var(--muted)' }}>separator</span>
                <div class="seg-ctrl">
                  {SEPARATORS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      class={opts.separator === s.value ? 'on' : ''}
                      onClick={() => update({ separator: s.value })}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  class={'btn ghost sm' + (opts.capitalize ? ' on' : '')}
                  onClick={() => update({ capitalize: !opts.capitalize })}
                >
                  {opts.capitalize ? (
                    <Icon name="Check" size={11} />
                  ) : (
                    <Icon name="X" size={11} />
                  )}{' '}
                  capitalize
                </button>
                <button
                  type="button"
                  class={'btn ghost sm' + (opts.appendDigit ? ' on' : '')}
                  onClick={() => update({ appendDigit: !opts.appendDigit })}
                >
                  {opts.appendDigit ? (
                    <Icon name="Check" size={11} />
                  ) : (
                    <Icon name="X" size={11} />
                  )}{' '}
                  append digit
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>output</span>
          <span class="actions">
            <button
              class="btn ghost sm"
              type="button"
              disabled={!secret}
              onClick={copy}
            >
              <Icon name={copied ? 'Check' : 'Copy'} size={11} /> copy
            </button>
          </span>
        </div>
        <div
          class="panel-b"
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {valid ? (
            <div
              class="hash-row"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <code style={{ flex: 1, wordBreak: 'break-all' }}>{secret}</code>
            </div>
          ) : (
            <span style={{ color: 'var(--muted)' }}>
              {opts.mode === 'password'
                ? 'Select at least one charset with 2+ distinct characters.'
                : 'Choose at least one word.'}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
