/**
 * generate.qr — text / URL → QR (inline SVG).
 *
 * `qrcode-generator` (~12 KB) emits a module-count grid; we paint
 * it ourselves as one <rect> per dark cell. Lives in this Tool's
 * lazy chunk so the shell bundle stays untouched.
 *
 * Type number 0 = auto-pick the smallest version that fits the
 * payload. Error correction M (~15% recoverable) is the standard
 * "scanner-friendly without bloating the cell count" middle.
 *
 * The light/dark mode QR remap lives in tools.css — rather than
 * burning a different colour scheme into the SVG, we let CSS rules
 * recolor the rects so theme flips travel without re-encoding.
 *
 * Input persists via useToolInput.
 */

import { useMemo } from 'preact/hooks'
import qrcode from 'qrcode-generator'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'

const SAMPLE = 'https://utils.blutarche.dev'
const QR_SIZE = 220

export default function Tool() {
  const [text, setText] = useToolInput('generate.qr', '')

  const svgMarkup = useMemo(() => (text ? buildSvg(text) : ''), [text])

  const copyText = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>qr.encode</h1>
        <button type="button" class="btn ghost sm" onClick={() => setText(SAMPLE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        <span class="chip">{text.length} chars</span>
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">
        Encode any text or URL into a QR code. Renders as inline SVG.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>input</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setText('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={text}
            placeholder="Text or URL to encode…"
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 200 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>qr</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={copyText}>
                <Icon name="Copy" size={11} /> text
              </button>
            </span>
          </div>
          <div class="panel-b">
            {text ? (
              <>
                <div class="qr-out" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
                <div
                  style={{
                    marginTop: 10,
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                  }}
                >
                  error correction · M · auto version
                </div>
              </>
            ) : (
              <div class="tool-empty">Your QR code appears here.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function buildSvg(text: string): string {
  // qrcode-generator throws on empty input; substitute a single space.
  const q = qrcode(0, 'M')
  q.addData(text || ' ')
  q.make()
  const n = q.getModuleCount()
  const cell = QR_SIZE / n
  const rects: string[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (q.isDark(r, c)) {
        rects.push(
          `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#000000"/>`,
        )
      }
    }
  }
  return `<svg width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}" xmlns="http://www.w3.org/2000/svg"><rect width="${QR_SIZE}" height="${QR_SIZE}" fill="#ffffff"/>${rects.join('')}</svg>`
}
