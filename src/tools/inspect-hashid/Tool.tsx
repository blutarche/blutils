/**
 * inspect.hashid — hash identifier.
 *
 * Takes a hash or password digest and lists the candidate
 * algorithms behind it, best-first, derived live from the pure
 * engine. We only match the *shape* — no cracking, no network.
 *
 * Confidence maps to a tinted chip: high → ok, medium → info, low →
 * neutral. Ambiguous matches (several algorithms share one hex
 * length) carry a `note` explaining the alternatives.
 *
 * Input persists via useToolInput.
 */

import { useMemo } from 'preact/hooks'
import type { Confidence } from './engine'
import { useToolInput } from '../../storage/use-tool-input'
import { identify } from './engine'

const SAMPLE = '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'

const CHIP_CLASS: Record<Confidence, string> = {
  high: 'chip ok',
  medium: 'chip info',
  low: 'chip',
}

export default function Tool() {
  const [input, setInput] = useToolInput('inspect.hashid', SAMPLE)

  const candidates = useMemo(() => identify(input), [input])
  const empty = candidates.length === 0

  return (
    <>
      <div class="tool-head">
        <h1>hash.identify</h1>
        {!empty && (
          <span class="chip">
            {candidates.length} candidate{candidates.length === 1 ? '' : 's'}
          </span>
        )}
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">
        Guesses the algorithm from the hash shape. No cracking, no network —
        nothing leaves your browser.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>input</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
              clear
            </button>
            <button class="btn ghost sm" type="button" onClick={() => setInput(SAMPLE)}>
              sample
            </button>
          </span>
        </div>
        <textarea
          class="area bare"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
          style={{ minHeight: 96 }}
        />
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>candidates</span>
        </div>
        <div class="panel-b">
          {empty ? (
            <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>
              Paste a hash to identify it.
            </div>
          ) : (
            candidates.map((c, i) => (
              <div
                class="hash-row"
                key={`${c.name}-${i}`}
                style={{ alignItems: 'center' }}
              >
                <div class="h-name">{c.name}</div>
                <div class="h-val" style={{ color: 'var(--muted)' }}>
                  {c.note ?? ''}
                </div>
                <span class={CHIP_CLASS[c.confidence]}>{c.confidence}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
