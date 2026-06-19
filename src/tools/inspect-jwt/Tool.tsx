/**
 * inspect.jwt — JWT (JWS compact) decoder.
 *
 * One textarea takes a token; the pure `decodeJwt` engine runs on
 * every keystroke. A valid parse renders the header and payload as
 * pretty JSON plus a .kv claims grid (alg/typ from the header,
 * formatted exp/iat/nbf from the payload). An invalid token swaps
 * the ok chip for a bad chip and shows the engine error inline.
 *
 * This is a decoder, not a verifier — the app is local with no
 * secret — so the signature is shown raw under an explicit
 * "signature not verified" note. The token persists via
 * useToolInput, and the detect strip seeds it via initialState.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { decodeJwt, interpretClaims } from './engine'

// The classic HS256 example token (jwt.io).
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

export default function Tool({ initialState }: ToolProps) {
  const seed = typeof initialState?.input === 'string' ? initialState.input : SAMPLE
  const [input, setInput] = useToolInput('inspect.jwt', seed)

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: null }
    try {
      return { ok: true as const, value: decodeJwt(input) }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input])

  const claims = useMemo(() => {
    if (!parsed.ok || !parsed.value) return []
    return interpretClaims(parsed.value.payload, Date.now())
  }, [parsed])

  const headerJson = useMemo(
    () => (parsed.ok && parsed.value ? JSON.stringify(parsed.value.header, null, 2) : ''),
    [parsed],
  )
  const payloadJson = useMemo(
    () => (parsed.ok && parsed.value ? JSON.stringify(parsed.value.payload, null, 2) : ''),
    [parsed],
  )

  const decoded = parsed.ok ? parsed.value : null
  const alg = decoded ? str(decoded.header.alg) : null
  const typ = decoded ? str(decoded.header.typ) : null

  const copy = (s: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(s).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>jwt.decode</h1>
        {parsed.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> ok
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        )}
        {alg && <span class="chip">{alg}</span>}
      </div>
      <p class="tool-sub">
        Decodes header, payload, and standard claims. Signature is not verified — no
        data leaves your browser.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>token</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
              clear
            </button>
            <button class="btn ghost sm" type="button" onClick={() => setInput(SAMPLE)}>
              sample
            </button>
          </span>
        </div>
        <div class="panel-b">
          <textarea
            class="area bare"
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            placeholder="eyJhbGciOi…"
            style={{ minHeight: 120 }}
          />
        </div>
      </div>

      {!parsed.ok && (
        <div class="panel">
          <div class="panel-b">
            <div class="json-error">{parsed.error}</div>
          </div>
        </div>
      )}

      {decoded && (
        <>
          <div class="two-col" style={{ marginBottom: 14 }}>
            <div class="panel">
              <div class="panel-h">
                <span>header</span>
                <span class="actions">
                  <button
                    class="btn ghost sm"
                    type="button"
                    onClick={() => copy(headerJson)}
                  >
                    <Icon name="Copy" size={11} /> copy
                  </button>
                </span>
              </div>
              <div class="panel-b">
                <pre class="hl-block" style={{ margin: 0 }}>
                  {headerJson}
                </pre>
              </div>
            </div>
            <div class="panel">
              <div class="panel-h">
                <span>payload</span>
                <span class="actions">
                  <button
                    class="btn ghost sm"
                    type="button"
                    onClick={() => copy(payloadJson)}
                  >
                    <Icon name="Copy" size={11} /> copy
                  </button>
                </span>
              </div>
              <div class="panel-b">
                <pre class="hl-block" style={{ margin: 0 }}>
                  {payloadJson}
                </pre>
              </div>
            </div>
          </div>

          <div class="panel" style={{ marginBottom: 14 }}>
            <div class="panel-h">
              <span>claims</span>
            </div>
            <div class="panel-b">
              <dl class="kv">
                <dt>alg</dt>
                <dd>{alg ?? '—'}</dd>
                <dt>typ</dt>
                <dd>{typ ?? '—'}</dd>
                {claims.map((c) => (
                  <>
                    <dt key={`dt-${c.name}`}>{c.name}</dt>
                    <dd key={`dd-${c.name}`}>
                      {c.iso}{' '}
                      <span class="chip" style={{ fontSize: 10 }}>
                        {c.note}
                      </span>
                    </dd>
                  </>
                ))}
              </dl>
            </div>
          </div>

          <div class="panel">
            <div class="panel-h">
              <span>signature</span>
            </div>
            <div class="panel-b">
              <dl class="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
                <dt>raw</dt>
                <dd>{decoded.signature || '(none)'}</dd>
              </dl>
              <p class="tool-sub" style={{ margin: '8px 0 0' }}>
                Signature is not verified — this tool decodes only and has no key.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
