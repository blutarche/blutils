/**
 * inspect.jsondiff — structural JSON diff.
 *
 * Two JSON textareas feed the pure `parseAndDiff` engine on every
 * keystroke. A valid pair renders a change list — one row per
 * change, with its JSONPath and before/after values. Added rows use
 * the ok chip, removed rows the bad chip, changed rows a neutral
 * chip. Equal documents (key order ignored) show a "no differences"
 * state. An invalid parse on either side swaps to a bad chip and
 * shows the engine's side-attributed error inline.
 *
 * Both inputs persist via useToolInput so a reload keeps your pair.
 */

import { useMemo } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { parseAndDiff, type ChangeType } from './engine'

const SAMPLE_A = `{"id":"u_8421","name":"Ada","active":true,"tags":["beta","admin"],"meta":{"twoFA":false,"logins":42}}`

const SAMPLE_B = `{"id":"u_8421","name":"Bea","tags":["beta","owner"],"meta":{"twoFA":true,"logins":42,"plan":"pro"}}`

/** Compact one-line preview of a JSON value for the change list. */
function preview(v: unknown): string {
  try {
    return JSON.stringify(v) ?? String(v)
  } catch {
    return String(v)
  }
}

const CHIP_CLASS: Record<ChangeType, string> = {
  added: 'chip ok',
  removed: 'chip bad',
  changed: 'chip',
}

const CHIP_LABEL: Record<ChangeType, string> = {
  added: 'added',
  removed: 'removed',
  changed: 'changed',
}

export default function Tool() {
  const [a, setA] = useToolInput('inspect.jsondiff.a', '')
  const [b, setB] = useToolInput('inspect.jsondiff.b', '')

  const isEmpty = a.trim() === '' && b.trim() === ''

  const result = useMemo(() => parseAndDiff(a, b), [a, b])

  return (
    <>
      <div class="tool-head">
        <h1>json.diff</h1>
        <button type="button" class="btn ghost sm" onClick={() => { setA(SAMPLE_A); setB(SAMPLE_B) }} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {isEmpty ? null : result.ok ? (
          <span class="chip">
            {result.changes.length}{' '}
            {result.changes.length === 1 ? 'change' : 'changes'}
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => {
            const tmp = a
            setA(b)
            setB(tmp)
          }}
        >
          <Icon name="ArrowLeftRight" size={11} /> swap
        </button>
      </div>
      <p class="tool-sub">
        Structural, semantic diff by path. Object key order is ignored; array
        order is significant. No data leaves your browser.
      </p>

      <div class="two-col" style={{ marginBottom: 14 }}>
        <div class="panel">
          <div class="panel-h">
            <span>A — original</span>
          </div>
          <textarea
            class="area bare"
            value={a}
            placeholder={'Paste original JSON here…\n\ne.g. {"name":"Ada"}'}
            onInput={(e) => setA((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 160 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>B — modified</span>
          </div>
          <textarea
            class="area bare"
            value={b}
            placeholder={'Paste modified JSON here…\n\ne.g. {"name":"Bea"}'}
            onInput={(e) => setB((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 160 }}
          />
        </div>
      </div>

      {isEmpty ? (
        <div class="tool-empty">Diff results appear here once both inputs contain JSON.</div>
      ) : !result.ok ? (
        <div class="json-error">{result.error}</div>
      ) : result.changes.length === 0 ? (
        <div class="json-error">
          <Icon name="Check" size={11} /> no differences — the two documents are
          structurally equal.
        </div>
      ) : (
        <div
          class="panel-b"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            lineHeight: 1.7,
          }}
        >
          {result.changes.map((c) => (
            <div
              key={c.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span class={CHIP_CLASS[c.type]}>{CHIP_LABEL[c.type]}</span>
              <span style={{ color: 'var(--ink-2)' }}>{c.path}</span>
              {c.type !== 'added' && (
                <span style={{ color: 'var(--tok-string)' }}>
                  {preview(c.before)}
                </span>
              )}
              {c.type === 'changed' && (
                <span style={{ color: 'var(--muted)' }}>→</span>
              )}
              {c.type !== 'removed' && (
                <span style={{ color: 'var(--tok-number)' }}>
                  {preview(c.after)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
