/**
 * inspect.unicode — break text into its Unicode code points.
 *
 * One row per code point with the glyph, its U+ hex, decimal value,
 * JS escape, and UTF-8 bytes. Iteration happens in engine.ts via
 * for..of so astral characters (emoji, etc.) are one row, not two
 * surrogate halves. Two chips in the head report the code-point count
 * and the UTF-16 code-unit count — they diverge exactly on astral
 * input, which is the headline insight the Tool exists to surface.
 *
 * Pure logic lives in engine.ts and is unit-tested there; this
 * component is a thin UI shell. Input persists via useToolInput. No
 * Unicode-name database is bundled (dependency-free by design), so
 * the table sticks to facts derivable from the code point itself.
 */

import { useMemo } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import {
  codePointCount,
  codeUnitCount,
  inspect,
  type CodePointInfo,
} from './engine'

const SAMPLE = 'Hi 👋 café'

/** Column template shared by the header and every body row. */
const ROW_COLS = '48px 88px 88px 1fr 1fr'

export default function Tool() {
  const [input, setInput] = useToolInput('inspect.unicode', '')

  const isEmpty = input === ''
  const rows = useMemo(() => inspect(input), [input])
  const points = useMemo(() => codePointCount(input), [input])
  const units = useMemo(() => codeUnitCount(input), [input])

  const copy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>unicode.inspect</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {!isEmpty && (
          <span class="chip info">
            {points} code point{points === 1 ? '' : 's'}
          </span>
        )}
        {!isEmpty && (
          <span class="chip">
            {units} UTF-16 unit{units === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <p class="tool-sub">
        Every code point with its U+ hex, decimal, JS escape, and UTF-8 bytes.
        Astral characters (emoji and the like) count as one code point but two
        UTF-16 units.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>text in</span>
          <span class="actions">
            <button
              class="btn ghost sm"
              type="button"
              onClick={() => setInput('')}
            >
              clear
            </button>
          </span>
        </div>
        <textarea
          class="area bare"
          value={input}
          placeholder="Type or paste text to inspect…"
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
          style={{ minHeight: 96 }}
        />
      </div>

      {rows.length === 0 ? (
        <div class="panel">
          <div class="tool-empty">Type or paste text to see its Unicode code points.</div>
        </div>
      ) : (
        <div class="panel">
          <div class="panel-h">
            <span>code points</span>
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
              {rows.length}
            </span>
          </div>
          <div class="panel-b">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: ROW_COLS,
                gap: '8px 12px',
                alignItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                paddingBottom: 8,
                borderBottom: '1px solid var(--line)',
              }}
            >
              <span>char</span>
              <span>U+</span>
              <span>decimal</span>
              <span>JS escape</span>
              <span>UTF-8</span>
            </div>
            {rows.map((row, i) => (
              <CodePointRow key={i} row={row} onCopy={copy} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function CodePointRow({
  row,
  onCopy,
}: {
  row: CodePointInfo
  onCopy: (text: string) => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_COLS,
        gap: '8px 12px',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 12.5,
        padding: '7px 0',
        borderTop: '1px dashed var(--line)',
      }}
    >
      <span style={{ fontSize: 18 }}>{row.jsEscape}</span>
      <Cell value={row.hex} onCopy={onCopy} />
      <Cell value={String(row.codePoint)} onCopy={onCopy} />
      <Cell value={row.esEscape} onCopy={onCopy} />
      <Cell value={row.utf8Bytes} onCopy={onCopy} />
    </div>
  )
}

/** A copy-on-click value cell. The copy icon fades in on hover. */
function Cell({
  value,
  onCopy,
}: {
  value: string
  onCopy: (text: string) => void
}) {
  return (
    <button
      type="button"
      class="btn ghost sm"
      title="copy"
      onClick={() => onCopy(value)}
      style={{
        justifyContent: 'flex-start',
        gap: 6,
        color: 'var(--ink)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
      <Icon name="Copy" size={11} />
    </button>
  )
}
