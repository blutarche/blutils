/**
 * text.lines — line-oriented text transforms.
 *
 * The left textarea is the editable source; the right textarea is
 * the result buffer. Each operation reads the result buffer and
 * rewrites it in place, so transforms stack (sort, then dedupe,
 * then trim, …). Editing the source resets the result to it.
 *
 * Sort honours the case-insensitive toggle; all other operations
 * are unconditional. The engine normalises mixed line endings to
 * `\n` on every pass, so the in/out line counts reflect that.
 */

import { useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import {
  dedupe,
  lineCount,
  removeBlankLines,
  reverseLines,
  sortAsc,
  sortDesc,
  trimLines,
} from './engine'

const SAMPLE = `banana
Apple
cherry
apple
banana

  date
`

export default function Tool() {
  const [text, setText] = useToolInput('text.lines', '')
  const [result, setResult] = useState(text)
  const [caseInsensitive, setCaseInsensitive] = useState(false)
  const [copied, setCopied] = useState(false)

  const isEmpty = text.trim() === ''

  const inLines = lineCount(text)
  const outLines = lineCount(result)

  const editSource = (next: string) => {
    setText(next)
    setResult(next)
  }

  const apply = (fn: (s: string) => string) => setResult((r) => fn(r))

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>text.lines</h1>
        <button type="button" class="btn ghost sm" onClick={() => editSource(SAMPLE)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {!isEmpty && <span class="chip">{inLines} lines</span>}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          class={'btn ghost sm' + (caseInsensitive ? ' on' : '')}
          onClick={() => setCaseInsensitive((c) => !c)}
          aria-pressed={caseInsensitive}
        >
          <Icon name={caseInsensitive ? 'Check' : 'X'} size={11} /> case-insensitive
        </button>
      </div>
      <p class="tool-sub">
        Sort, dedupe, trim, reverse, and filter lines. Operations stack on the
        result buffer. Local-only.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-b" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => apply((s) => sortAsc(s, { caseInsensitive }))}
          >
            <Icon name="List" size={11} /> sort A→Z
          </button>
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => apply((s) => sortDesc(s, { caseInsensitive }))}
          >
            <Icon name="List" size={11} /> sort Z→A
          </button>
          <button type="button" class="btn ghost sm" onClick={() => apply(dedupe)}>
            <Icon name="List" size={11} /> unique
          </button>
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => apply(reverseLines)}
          >
            <Icon name="List" size={11} /> reverse
          </button>
          <button type="button" class="btn ghost sm" onClick={() => apply(trimLines)}>
            <Icon name="List" size={11} /> trim
          </button>
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => apply(removeBlankLines)}
          >
            <Icon name="List" size={11} /> remove blank
          </button>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>input</span>
            <span class="chip">{inLines} lines</span>
          </div>
          <textarea
            class="area bare"
            value={text}
            placeholder="Paste lines here…"
            onInput={(e) => editSource((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 240 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>output</span>
            <span class="actions">
              {!isEmpty && <span class="chip">{outLines} lines</span>}
              <button class="btn ghost sm" type="button" onClick={copy} disabled={isEmpty}>
                <Icon name={copied ? 'Check' : 'Copy'} size={11} /> copy
              </button>
            </span>
          </div>
          {isEmpty ? (
            <div class="tool-empty">Transformed lines appear here.</div>
          ) : (
            <textarea
              class="area bare"
              value={result}
              readOnly
              spellcheck={false}
              style={{ minHeight: 240 }}
            />
          )}
        </div>
      </div>
    </>
  )
}
