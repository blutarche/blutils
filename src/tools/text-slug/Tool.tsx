/**
 * text.slug — slugify text into a url-safe permalink.
 *
 * Single input on top, live slug output below. Two controls: a
 * separator toggle (hyphen / underscore) and a lowercase toggle.
 * The transform runs on every keystroke through the dependency-free
 * engine — fast enough at the input cap that it needs no debounce.
 *
 * Input persists via useToolInput so a reload keeps your text. The
 * toggles are transient session state (they don't outlive a reload),
 * matching the other text Tools.
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { slugify, type Separator } from './engine'

const SAMPLE = 'Crème Brûlée & Café au Lait — 100% Délicieux!'

export default function Tool() {
  const [input, setInput] = useToolInput('text.slug', SAMPLE)
  const [separator, setSeparator] = useState<Separator>('-')
  const [lower, setLower] = useState(true)
  const [copied, setCopied] = useState(false)

  const output = useMemo(
    () => slugify(input, { separator, lower }),
    [input, separator, lower],
  )

  const copy = () => {
    if (!output) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(output).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>text.slug</h1>
        <div style={{ flex: 1 }} />
        <div class="seg-ctrl">
          <button
            type="button"
            class={separator === '-' ? 'on' : ''}
            onClick={() => setSeparator('-')}
          >
            hyphen
          </button>
          <button
            type="button"
            class={separator === '_' ? 'on' : ''}
            onClick={() => setSeparator('_')}
          >
            underscore
          </button>
        </div>
        <button
          type="button"
          class="btn"
          onClick={() => setLower((v) => !v)}
          aria-pressed={lower}
        >
          <Icon name={lower ? 'Check' : 'Plus'} size={11} />
          lowercase
        </button>
      </div>
      <p class="tool-sub">
        Strips accents, lowercases, and collapses punctuation into a clean
        permalink. Runs live; nothing leaves your browser.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>input</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => setInput(SAMPLE)}
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
            <span>output</span>
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                disabled={!output}
                onClick={copy}
              >
                <Icon name={copied ? 'Check' : 'Copy'} size={11} /> copy
              </button>
            </span>
          </div>
          <div class="panel-b">
            {output ? (
              <code style={{ wordBreak: 'break-all' }}>{output}</code>
            ) : (
              <span style={{ color: 'var(--muted)' }}>
                Type some text to generate a slug.
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
