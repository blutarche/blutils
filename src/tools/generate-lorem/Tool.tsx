/**
 * generate.lorem — placeholder text generator.
 *
 * Three units: words, sentences, paragraphs. Count via segmented
 * +/- pair and a range slider for fast adjustment. A regenerate
 * button bumps a seed so the output reshuffles without changing
 * any other parameter.
 *
 * Word bank is the classic 70-word lorem corpus, capitalised first
 * word per generated chunk, sentences end with a period.
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'

const WORDS = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum`.split(
  ' ',
)

type Unit = 'words' | 'sentences' | 'paragraphs'

function pickWords(n: number): string {
  const out: string[] = []
  for (let i = 0; i < n; i++) out.push(WORDS[Math.floor(Math.random() * WORDS.length)]!)
  if (out.length) out[0] = out[0]![0]!.toUpperCase() + out[0]!.slice(1)
  return out.join(' ')
}

function makeSentence(): string {
  const n = 8 + Math.floor(Math.random() * 10)
  return pickWords(n) + '.'
}

function makeParagraph(): string {
  const n = 3 + Math.floor(Math.random() * 4)
  return Array.from({ length: n }, makeSentence).join(' ')
}

export default function Tool() {
  const [unit, setUnit] = useState<Unit>('paragraphs')
  const [count, setCount] = useState(3)
  const [seed, setSeed] = useState(1)

  const out = useMemo(() => {
    // seed is referenced to force regeneration; not used for determinism.
    void seed
    if (unit === 'words') return pickWords(count)
    if (unit === 'sentences')
      return Array.from({ length: count }, makeSentence).join(' ')
    return Array.from({ length: count }, makeParagraph).join('\n\n')
  }, [unit, count, seed])

  const wordCount = useMemo(
    () => out.split(/\s+/).filter(Boolean).length,
    [out],
  )

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(out).catch(() => {})
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>lorem.ipsum</h1>
        <span class="chip">{wordCount} words</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => setSeed((s) => s + 1)}
        >
          <Icon name="Sparkles" size={11} /> regenerate
        </button>
      </div>
      <p class="tool-sub">Filler text — words, sentences, or paragraphs.</p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div
          class="panel-b"
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <div class="seg-ctrl">
            {(['words', 'sentences', 'paragraphs'] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                class={unit === u ? 'on' : ''}
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>
          <span style={{ color: 'var(--muted)' }}>count</span>
          <div class="seg-ctrl">
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
            >
              <Icon name="Minus" size={10} />
            </button>
            <button type="button" style={{ minWidth: 36 }} class="on">
              {count}
            </button>
            <button type="button" onClick={() => setCount((c) => c + 1)}>
              <Icon name="Plus" size={10} />
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={count}
            onInput={(e) =>
              setCount(parseInt((e.target as HTMLInputElement).value, 10))
            }
            style={{ flex: 1, minWidth: 120 }}
          />
        </div>
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>output</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={copy}>
              <Icon name="Copy" size={11} /> copy
            </button>
          </span>
        </div>
        <div
          class="panel-b lorem-out"
          style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
        >
          {out}
        </div>
      </div>
    </>
  )
}
