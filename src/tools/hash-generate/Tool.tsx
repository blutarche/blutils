/**
 * hash.generate — MD5, SHA-1, SHA-256, SHA-512.
 *
 * SHA family runs through SubtleCrypto so we get native-speed
 * digests and zero algorithm code in our bundle. MD5 is hand-rolled
 * (see ./md5.ts) because every browser dropped it from SubtleCrypto
 * for security reasons — but we still ship it for compatibility
 * with legacy systems, flagged 'weak' in the UI.
 *
 * Each input keystroke re-runs every digest. SHA computations are
 * Promise-based; we guard against stale results with a cancellation
 * flag so a fast typist doesn't see digests from earlier states.
 *
 * Input persists via useToolInput.
 */

import { useEffect, useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'
import { useToolInput } from '../../storage/use-tool-input'
import { md5 } from './md5'

const SAMPLE = 'the quick brown fox jumps over the lazy dog'

type Digests = {
  md5: string
  sha1: string
  sha256: string
  sha512: string
}

const EMPTY: Digests = { md5: '', sha1: '', sha256: '', sha512: '' }

export default function Tool() {
  const [input, setInput] = useToolInput('hash.generate', '')
  const [digests, setDigests] = useState<Digests>(EMPTY)

  useEffect(() => {
    if (input === '') {
      setDigests(EMPTY)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [sha1, sha256, sha512] = await Promise.all([
          subtleDigest('SHA-1', input),
          subtleDigest('SHA-256', input),
          subtleDigest('SHA-512', input),
        ])
        if (cancelled) return
        setDigests({ md5: md5(input), sha1, sha256, sha512 })
      } catch {
        if (!cancelled) setDigests(EMPTY)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [input])

  const inputBytes = useMemo(() => byteLength(input), [input])

  const copy = (value: string) => {
    copyText(value)
  }

  const rows: Array<[string, keyof Digests, boolean]> = [
    ['MD5', 'md5', true],
    ['SHA-1', 'sha1', false],
    ['SHA-256', 'sha256', false],
    ['SHA-512', 'sha512', false],
  ]

  return (
    <>
      <div class="tool-head">
        <h1>hash.generate</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        <span class="chip">{inputBytes} bytes in</span>
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">
        Computes locally via SubtleCrypto. MD5 is for compatibility only — don't use
        it for security.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>input</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
              clear
            </button>
          </span>
        </div>
        <textarea
          class="area bare"
          value={input}
          placeholder="Text to hash…"
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
          style={{ minHeight: 96 }}
        />
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>digests</span>
        </div>
        <div style={{ padding: '4px 14px' }}>
          {rows.map(([name, key, weak]) => {
            const value = digests[key]
            return (
              <div class="hash-row" key={name}>
                <div class="h-name">
                  {name}
                  {weak && (
                    <span
                      class="chip bad"
                      style={{
                        marginLeft: 6,
                        padding: '0 5px',
                        fontSize: 9,
                      }}
                    >
                      weak
                    </span>
                  )}
                </div>
                <div class="h-val">{value || '…'}</div>
                <button
                  class="btn ghost sm"
                  type="button"
                  onClick={() => copy(value)}
                  aria-label={`Copy ${name}`}
                >
                  <Icon name="Copy" size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

async function subtleDigest(algo: 'SHA-1' | 'SHA-256' | 'SHA-512', text: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return ''
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function byteLength(s: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length
  return s.length
}
