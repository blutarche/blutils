/**
 * hash.hmac — keyed-hash (HMAC) generator.
 *
 * The HMAC runs through SubtleCrypto via the pure engine, which
 * also handles the key/output encoding plumbing. A key may be
 * typed as UTF-8 text, hex, or base64; the digest renders as hex
 * or base64.
 *
 * Each keystroke or option change re-runs the (async) HMAC; a
 * cancellation flag guards against a fast typist seeing a tag from
 * an earlier state. A malformed hex/base64 key is surfaced as a
 * `chip bad` instead of throwing.
 *
 * Only the *options* (message, key, encodings, algorithm) persist
 * via useToolInput, JSON-encoded.
 */

import { useEffect, useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import {
  hmac,
  type HmacAlgo,
  type KeyEncoding,
  type OutputEncoding,
} from './engine'

interface Opts {
  message: string
  key: string
  keyEncoding: KeyEncoding
  algo: HmacAlgo
  output: OutputEncoding
}

const DEFAULTS: Opts = {
  message: '',
  key: 'secret',
  keyEncoding: 'utf-8',
  algo: 'SHA-256',
  output: 'hex',
}

const ALGOS: HmacAlgo[] = ['SHA-256', 'SHA-384', 'SHA-512']
const ALGO_LABELS: Record<HmacAlgo, string> = {
  'SHA-256': '256',
  'SHA-384': '384',
  'SHA-512': '512',
}
const KEY_ENCODINGS: KeyEncoding[] = ['utf-8', 'hex', 'base64']
const OUTPUTS: OutputEncoding[] = ['hex', 'base64']

export default function Tool() {
  const [raw, setRaw] = useToolInput('hash.hmac', JSON.stringify(DEFAULTS))
  const [result, setResult] = useState('')
  const [keyError, setKeyError] = useState(false)
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const tag = await hmac(opts.message, opts.key, opts.algo, {
          keyEncoding: opts.keyEncoding,
          output: opts.output,
        })
        if (cancelled) return
        setResult(tag)
        setKeyError(false)
      } catch {
        if (cancelled) return
        // Almost always a malformed hex/base64 key; flag it.
        setResult('')
        setKeyError(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opts.message, opts.key, opts.keyEncoding, opts.algo, opts.output])

  const copy = () => {
    if (!result) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>hash.hmac</h1>
        {keyError ? (
          <span class="chip bad">bad {opts.keyEncoding} key</span>
        ) : (
          <span class="chip">{opts.algo}</span>
        )}
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">
        Keyed-hash message authentication code, computed locally via
        SubtleCrypto. Nothing is sent anywhere.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>message</span>
          <span class="actions">
            <button
              class="btn ghost sm"
              type="button"
              onClick={() => update({ message: '' })}
            >
              clear
            </button>
          </span>
        </div>
        <textarea
          class="area bare"
          value={opts.message}
          onInput={(e) =>
            update({ message: (e.target as HTMLTextAreaElement).value })
          }
          spellcheck={false}
          style={{ minHeight: 80 }}
        />
      </div>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--muted)' }}>key</span>
            <input
              class="input"
              type="text"
              placeholder="secret key"
              value={opts.key}
              style={{ flex: 1 }}
              onInput={(e) =>
                update({ key: (e.target as HTMLInputElement).value })
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
            <span style={{ color: 'var(--muted)' }}>key as</span>
            <div class="seg-ctrl">
              {KEY_ENCODINGS.map((k) => (
                <button
                  key={k}
                  type="button"
                  class={opts.keyEncoding === k ? 'on' : ''}
                  onClick={() => update({ keyEncoding: k })}
                >
                  {k}
                </button>
              ))}
            </div>

            <span style={{ color: 'var(--muted)' }}>algorithm</span>
            <div class="seg-ctrl">
              {ALGOS.map((a) => (
                <button
                  key={a}
                  type="button"
                  class={opts.algo === a ? 'on' : ''}
                  onClick={() => update({ algo: a })}
                >
                  {ALGO_LABELS[a]}
                </button>
              ))}
            </div>

            <span style={{ color: 'var(--muted)' }}>output</span>
            <div class="seg-ctrl">
              {OUTPUTS.map((o) => (
                <button
                  key={o}
                  type="button"
                  class={opts.output === o ? 'on' : ''}
                  onClick={() => update({ output: o })}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>hmac</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={copy}>
              <Icon name={copied ? 'Check' : 'Copy'} size={11} /> copy
            </button>
          </span>
        </div>
        <div class="panel-b">
          {keyError ? (
            <span style={{ color: 'var(--muted)' }}>
              The key is not valid {opts.keyEncoding}. Fix it or switch the key
              encoding.
            </span>
          ) : opts.message === '' ? (
            <div class="tool-empty">HMAC appears here.</div>
          ) : (
            <code style={{ wordBreak: 'break-all' }}>{result || '…'}</code>
          )}
        </div>
      </div>
    </>
  )
}
