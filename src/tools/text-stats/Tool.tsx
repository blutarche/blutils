/**
 * text.stats — live text statistics.
 *
 * A single input textarea on the left, a grid of stat chips on the
 * right. Every count recomputes on each keystroke; the engine is
 * pure string work and fast enough at the input cap that no
 * debouncing is needed.
 *
 * All counting heuristics live in engine.ts (code-point chars,
 * whitespace-run words, blank-line paragraphs, terminal-punctuation
 * sentences, 200-wpm reading time) and are documented there. This
 * file is presentation only.
 *
 * Input persists through useToolInput so a reload keeps your text
 * (sessionStorage by default, localStorage under rememberInputs).
 */

import { useMemo } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { stats } from './engine'

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. It was a bright cold day in April, and the clocks were striking thirteen.

Type or paste anything here and the counts update live. Nothing leaves your browser.`

export default function Tool() {
  const [input, setInput] = useToolInput('text.stats', SAMPLE_TEXT)

  const s = useMemo(() => stats(input), [input])

  const readingTime =
    s.readingTimeMin === 0
      ? '—'
      : `${s.readingTimeMin} min`

  return (
    <>
      <div class="tool-head">
        <h1>text.stats</h1>
        <span class="chip accent">
          <Icon name="Sigma" size={11} /> {s.words} words
        </span>
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">
        Live character, word, line, sentence, and paragraph counts. No data
        leaves your browser.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>input</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => setInput('')}
              >
                clear
              </button>
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => setInput(SAMPLE_TEXT)}
              >
                sample
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 360 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>statistics</span>
          </div>
          <div class="panel-b">
            <dl class="kv">
              <dt>characters</dt>
              <dd>{s.chars.toLocaleString()}</dd>
              <dt>no spaces</dt>
              <dd>{s.charsNoSpaces.toLocaleString()}</dd>
              <dt>bytes (UTF-8)</dt>
              <dd>{s.bytes.toLocaleString()}</dd>
              <dt>words</dt>
              <dd>{s.words.toLocaleString()}</dd>
              <dt>lines</dt>
              <dd>{s.lines.toLocaleString()}</dd>
              <dt>sentences</dt>
              <dd>{s.sentences.toLocaleString()}</dd>
              <dt>paragraphs</dt>
              <dd>{s.paragraphs.toLocaleString()}</dd>
              <dt>reading time</dt>
              <dd>{readingTime}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="json-stats" style={{ marginTop: 12 }}>
        <span class="chip">{s.chars.toLocaleString()} chars</span>
        <span class="chip">{s.words.toLocaleString()} words</span>
        <span class="chip">{s.lines.toLocaleString()} lines</span>
        <span class="chip">{s.sentences.toLocaleString()} sentences</span>
        <span class="chip">{s.paragraphs.toLocaleString()} paragraphs</span>
        <span class="chip accent">{readingTime} read</span>
      </div>
    </>
  )
}
