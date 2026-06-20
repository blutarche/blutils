/**
 * encode.jws — JWT (JWS compact) signer (HMAC).
 *
 * The counterpart to inspect.jwt's decoder. Header and payload are
 * edited as JSON; a secret and an algorithm drive an HMAC signature
 * computed locally via SubtleCrypto. Each keystroke or option change
 * re-runs the (async) signer; a cancellation flag guards a fast
 * typist against seeing a token from an earlier state.
 *
 * Invalid JSON in either editor swaps the ok chip for a `chip bad`
 * and shows the parse error inline instead of signing. Unlike the
 * decoder this tool holds the secret — which is fine because the app
 * is local-only; the UI says so explicitly.
 *
 * The options (header, payload, secret, algorithm) persist via
 * useToolInput, JSON-encoded.
 */

import { useEffect, useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { signJwt, type JwtAlgo } from './engine'

interface Opts {
  header: string
  payload: string
  secret: string
  algo: JwtAlgo
}

const DEFAULTS: Opts = {
  header: '{\n  "alg": "HS256",\n  "typ": "JWT"\n}',
  payload: '',
  secret: 'your-256-bit-secret',
  algo: 'HS256',
}

const ALGOS: JwtAlgo[] = ['HS256', 'HS384', 'HS512']

function parseObject(text: string): Record<string, unknown> {
  const value: unknown = JSON.parse(text)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('must be a JSON object')
  }
  return value as Record<string, unknown>
}

export default function Tool() {
  const [raw, setRaw] = useToolInput('encode.jws', JSON.stringify(DEFAULTS))
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
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
    if (opts.payload.trim() === '') {
      setToken('')
      setError(null)
      return
    }
    let cancelled = false
    ;(async () => {
      let header: Record<string, unknown>
      let payload: Record<string, unknown>
      try {
        header = parseObject(opts.header)
      } catch (err) {
        if (!cancelled) {
          setToken('')
          setError(`header JSON: ${(err as Error).message}`)
        }
        return
      }
      try {
        payload = parseObject(opts.payload)
      } catch (err) {
        if (!cancelled) {
          setToken('')
          setError(`payload JSON: ${(err as Error).message}`)
        }
        return
      }
      try {
        const t = await signJwt(header, payload, opts.secret, opts.algo)
        if (cancelled) return
        setToken(t)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setToken('')
        setError((err as Error).message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opts.header, opts.payload, opts.secret, opts.algo])

  const copy = () => {
    if (!token) return
    if (copyText(token)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>jwt.sign</h1>
        {opts.payload.trim() === '' ? null : error ? (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        ) : (
          <span class="chip ok">
            <Icon name="Check" size={11} /> ok
          </span>
        )}
        <span class="chip">{opts.algo}</span>
      </div>
      <p class="tool-sub">
        Signs a JWT with HMAC (HS256/384/512) locally via SubtleCrypto. The secret
        stays in your browser — nothing is sent anywhere.
      </p>

      <div class="two-col" style={{ marginBottom: 14 }}>
        <div class="panel">
          <div class="panel-h">
            <span>header</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => update({ header: DEFAULTS.header })}
              >
                reset
              </button>
            </span>
          </div>
          <div class="panel-b">
            <textarea
              class="area bare"
              value={opts.header}
              onInput={(e) =>
                update({ header: (e.target as HTMLTextAreaElement).value })
              }
              spellcheck={false}
              style={{ minHeight: 120 }}
            />
          </div>
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>payload</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => update({ payload: DEFAULTS.payload })}
              >
                reset
              </button>
            </span>
          </div>
          <div class="panel-b">
            <textarea
              class="area bare"
              value={opts.payload}
              onInput={(e) =>
                update({ payload: (e.target as HTMLTextAreaElement).value })
              }
              spellcheck={false}
              style={{ minHeight: 120 }}
            />
          </div>
        </div>
      </div>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--muted)' }}>secret</span>
            <input
              class="input"
              type="text"
              placeholder="signing secret"
              value={opts.secret}
              style={{ flex: 1 }}
              onInput={(e) =>
                update({ secret: (e.target as HTMLInputElement).value })
              }
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--muted)' }}>algorithm</span>
            <div class="seg-ctrl">
              {ALGOS.map((a) => (
                <button
                  key={a}
                  type="button"
                  class={opts.algo === a ? 'on' : ''}
                  onClick={() => update({ algo: a })}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div class="panel" style={{ marginBottom: 14 }}>
          <div class="panel-b">
            <div class="json-error">{error}</div>
          </div>
        </div>
      )}

      <div class="panel">
        <div class="panel-h">
          <span>token</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={copy}>
              <Icon name={copied ? 'Check' : 'Copy'} size={11} /> copy
            </button>
          </span>
        </div>
        <div class="panel-b">
          {opts.payload.trim() === '' ? (
            <div class="tool-empty">Signed token appears here.</div>
          ) : (
            <code style={{ wordBreak: 'break-all' }}>{token || '…'}</code>
          )}
        </div>
      </div>
    </>
  )
}
