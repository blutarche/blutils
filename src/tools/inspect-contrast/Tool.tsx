/**
 * inspect.contrast — WCAG color contrast checker.
 *
 * Two color slices (foreground / background), each editable via a
 * native color picker and a free-text field that accepts hex or
 * rgb()/rgba(). When the text doesn't parse, the swatch falls back
 * to a neutral and the ratio panel shows nothing for that side.
 *
 * The center of the Tool is a live sample preview rendered with the
 * two colors, the computed ratio (e.g. "7.0:1"), and four pass/fail
 * chips: AA / AAA for normal text and AA / AAA for large text. The
 * thresholds come straight from the engine's wcagAssess.
 *
 * Both inputs persist via useToolInput so a reload keeps your pair
 * (sessionStorage by default, localStorage with rememberInputs).
 */

import { useMemo } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { effectiveContrast, parseColor, wcagAssess } from './engine'

const SAMPLE_FG = '#777777'
const SAMPLE_BG = '#ffffff'

/** "#rrggbb" for a parsed color, used to seed the native picker. */
function toHex(c: { r: number; g: number; b: number }): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}

export default function Tool() {
  const [fgText, setFgText] = useToolInput('inspect.contrast.fg', '')
  const [bgText, setBgText] = useToolInput('inspect.contrast.bg', '')

  const isEmpty = fgText.trim() === '' && bgText.trim() === ''

  const fg = useMemo(() => (fgText.trim() ? parseColor(fgText) : null), [fgText])
  const bg = useMemo(() => (bgText.trim() ? parseColor(bgText) : null), [bgText])

  const ratio = useMemo(
    () => (fg && bg ? effectiveContrast(fg, bg) : null),
    [fg, bg],
  )
  const assess = useMemo(
    () => (ratio !== null ? wcagAssess(ratio) : null),
    [ratio],
  )

  const fgCss = fg ? toHex(fg) : 'transparent'
  const bgCss = bg ? toHex(bg) : 'transparent'

  return (
    <>
      <div class="tool-head">
        <h1>color.contrast</h1>
        <button type="button" class="btn ghost sm" onClick={() => { setFgText(SAMPLE_FG); setBgText(SAMPLE_BG) }} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {isEmpty ? null : ratio !== null ? (
          <span class="chip accent">{ratio.toFixed(1)}:1</span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid color
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          class="btn"
          onClick={() => {
            setFgText(bgText)
            setBgText(fgText)
          }}
        >
          <Icon name="ArrowLeftRight" size={11} /> swap
        </button>
      </div>
      <p class="tool-sub">
        WCAG 2.x ratio between two colors. Accepts hex or rgb(). No data
        leaves your browser.
      </p>

      <div class="two-col" style={{ marginBottom: 14 }}>
        <ColorField
          label="foreground"
          text={fgText}
          onText={setFgText}
          swatch={fgCss}
          valid={fg !== null}
          fallback={SAMPLE_FG}
          placeholder={SAMPLE_FG}
        />
        <ColorField
          label="background"
          text={bgText}
          onText={setBgText}
          swatch={bgCss}
          valid={bg !== null}
          fallback={SAMPLE_BG}
          placeholder={SAMPLE_BG}
        />
      </div>

      {isEmpty ? (
        <div class="panel">
          <div class="tool-empty">
            Enter a foreground and background color to see the WCAG contrast
            ratio.
          </div>
        </div>
      ) : (
        <>
          <div class="panel" style={{ marginBottom: 14 }}>
            <div class="panel-h">
              <span>sample</span>
            </div>
            <div
              class="panel-b"
              style={{
                background: bgCss,
                color: fgCss,
                padding: '24px 20px',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3 }}>
                The quick brown fox
              </div>
              <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
                jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-h">
              <span>wcag</span>
              {ratio !== null && (
                <span class="actions">
                  <span class="chip">{ratio.toFixed(2)}:1</span>
                </span>
              )}
            </div>
            <div class="panel-b">
              {assess ? (
                <dl class="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
                  <dt>normal AA</dt>
                  <dd>
                    <Badge pass={assess.normalAA} hint="≥ 4.5" />
                  </dd>
                  <dt>normal AAA</dt>
                  <dd>
                    <Badge pass={assess.normalAAA} hint="≥ 7" />
                  </dd>
                  <dt>large AA</dt>
                  <dd>
                    <Badge pass={assess.largeAA} hint="≥ 3" />
                  </dd>
                  <dt>large AAA</dt>
                  <dd>
                    <Badge pass={assess.largeAAA} hint="≥ 4.5" />
                  </dd>
                </dl>
              ) : (
                <div class="palette-empty" style={{ padding: 12 }}>
                  enter two valid colors
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

interface ColorFieldProps {
  label: string
  text: string
  onText: (v: string) => void
  swatch: string
  valid: boolean
  fallback: string
  placeholder?: string
}

function ColorField({
  label,
  text,
  onText,
  swatch,
  valid,
  fallback,
  placeholder = '#rrggbb or rgb(…)',
}: ColorFieldProps) {
  return (
    <div class="panel">
      <div class="panel-h">
        <span>{label}</span>
        {text.trim() !== '' && !valid && (
          <span class="actions">
            <span class="chip bad">invalid</span>
          </span>
        )}
      </div>
      <div
        class="panel-b"
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--r-1)',
            border: '1px solid var(--line)',
            background: valid ? swatch : 'var(--surface-2)',
            flexShrink: 0,
          }}
        />
        <input
          type="color"
          value={valid ? swatch : fallback}
          onInput={(e) => onText((e.target as HTMLInputElement).value)}
          aria-label={`${label} color picker`}
          style={{
            width: 34,
            height: 32,
            padding: 0,
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-1)',
            background: 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <input
          class="input"
          value={text}
          onInput={(e) => onText((e.target as HTMLInputElement).value)}
          spellcheck={false}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

function Badge({ pass, hint }: { pass: boolean; hint: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span class={pass ? 'chip ok' : 'chip bad'}>
        <Icon name={pass ? 'Check' : 'X'} size={11} /> {pass ? 'pass' : 'fail'}
      </span>
      <span style={{ color: 'var(--muted)', fontSize: 11 }}>{hint}</span>
    </span>
  )
}
