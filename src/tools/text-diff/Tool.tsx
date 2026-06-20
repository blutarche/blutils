/**
 * text.diff — side-by-side line diff or inline character diff.
 *
 * Two modes:
 *
 *   - line: classic side-by-side grid. LCS over line arrays. Pairs
 *     every removal with the next addition where possible so the
 *     visual rhythm reads "this line became that line".
 *   - char: inline single-block diff. LCS over the joined character
 *     stream of both buffers. Equal runs render plain; removed runs
 *     show with a red background and strikethrough; added runs with
 *     a green background.
 *
 * Both modes share lcsDiff under the hood. Char mode is O(M*N) on
 * the full character stream and hits the same 250 000-cell cap;
 * for buffers above that the panel renders an explanatory error.
 *
 * Ignore-whitespace normalises lines (line mode) or collapses
 * runs of whitespace to a single space (char mode) before the
 * LCS pass. Swap exchanges A and B in place. Both buffers persist.
 */

import { useMemo } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { useSeededState } from '../format-json/use-seeded-state'
import { lcsDiff, type DiffOp } from './lcs'

const SAMPLE_A = `function greet(name) {
  console.log("hello, " + name);
  return name.length;
}`

const SAMPLE_B = `function greet(name, loud) {
  const msg = "hello, " + name;
  console.log(loud ? msg.toUpperCase() : msg);
  return msg.length;
}`

type Mode = 'line' | 'char'

interface Row {
  L: DiffOp | null
  R: DiffOp | null
}

export default function Tool() {
  const [a, setA] = useToolInput('text.diff.a', '')
  const [b, setB] = useToolInput('text.diff.b', '')
  const [ignoreWs, setIgnoreWs] = useSeededState<boolean>(false)
  const [mode, setMode] = useSeededState<Mode>('line')

  const isEmpty = a.trim() === '' && b.trim() === ''

  const lineResult = useMemo(() => {
    if (mode !== 'line') return null
    const norm = (s: string): string[] =>
      ignoreWs
        ? s.split('\n').map((line) => line.replace(/\s+/g, ' ').trim())
        : s.split('\n')
    return lcsDiff(norm(a), norm(b))
  }, [a, b, ignoreWs, mode])

  const charResult = useMemo(() => {
    if (mode !== 'char') return null
    const prep = (s: string): string =>
      ignoreWs ? s.replace(/\s+/g, ' ') : s
    const aChars = [...prep(a)]
    const bChars = [...prep(b)]
    return lcsDiff(aChars, bChars)
  }, [a, b, ignoreWs, mode])

  const stats = useMemo(() => {
    const r = mode === 'line' ? lineResult : charResult
    if (!r) return null
    return r.reduce(
      (acc, x) => {
        if (x.t === '+') acc.add++
        else if (x.t === '-') acc.del++
        else acc.eq++
        return acc
      },
      { add: 0, del: 0, eq: 0 },
    )
  }, [mode, lineResult, charResult])

  const rows = useMemo<Row[]>(() => {
    if (mode !== 'line' || !lineResult) return []
    const out: Row[] = []
    const pending: DiffOp[] = []
    for (const r of lineResult) {
      if (r.t === '=') {
        while (pending.length) out.push({ L: pending.shift()!, R: null })
        out.push({ L: r, R: r })
      } else if (r.t === '-') {
        pending.push(r)
      } else {
        if (pending.length) out.push({ L: pending.shift()!, R: r })
        else out.push({ L: null, R: r })
      }
    }
    while (pending.length) out.push({ L: pending.shift()!, R: null })
    return out
  }, [mode, lineResult])

  // Compress char-mode result into runs of consecutive same-op chars.
  const charRuns = useMemo<Array<{ t: '=' | '-' | '+'; value: string }>>(() => {
    if (mode !== 'char' || !charResult) return []
    const out: Array<{ t: '=' | '-' | '+'; value: string }> = []
    for (const op of charResult) {
      const ch = op.t === '+' ? op.b : op.a
      const last = out[out.length - 1]
      if (last && last.t === op.t) last.value += ch
      else out.push({ t: op.t, value: ch })
    }
    return out
  }, [mode, charResult])

  const result = mode === 'line' ? lineResult : charResult
  const subText =
    mode === 'line'
      ? 'Line-by-line diff, side by side. LCS algorithm.'
      : 'Character-by-character diff, inline. Best for short inputs — the LCS table caps at 250 000 cells.'

  return (
    <>
      <div class="tool-head">
        <h1>text.diff</h1>
        <button type="button" class="btn ghost sm" onClick={() => { setA(SAMPLE_A); setB(SAMPLE_B) }} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {!isEmpty && stats && <span class="chip ok">+{stats.add}</span>}
        {!isEmpty && stats && <span class="chip bad">−{stats.del}</span>}
        {!isEmpty && stats && <span class="chip">{stats.eq} unchanged</span>}
        <div style={{ flex: 1 }} />
        <div class="seg-ctrl">
          <button
            type="button"
            class={mode === 'line' ? 'on' : ''}
            onClick={() => setMode('line')}
          >
            line
          </button>
          <button
            type="button"
            class={mode === 'char' ? 'on' : ''}
            onClick={() => setMode('char')}
          >
            char
          </button>
        </div>
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => setIgnoreWs((s) => !s)}
          aria-pressed={ignoreWs}
        >
          <Icon name={ignoreWs ? 'Check' : 'Plus'} size={11} /> ignore whitespace
        </button>
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
      <p class="tool-sub">{subText}</p>

      <div class="two-col" style={{ marginBottom: 14 }}>
        <div class="panel">
          <div class="panel-h">
            <span>A — original</span>
          </div>
          <textarea
            class="area bare"
            value={a}
            placeholder="Original text…"
            onInput={(e) => setA((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 140 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>B — modified</span>
          </div>
          <textarea
            class="area bare"
            value={b}
            placeholder="Modified text…"
            onInput={(e) => setB((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 140 }}
          />
        </div>
      </div>

      {isEmpty ? (
        <div class="panel">
          <div class="tool-empty">Paste text into both panels to see the diff.</div>
        </div>
      ) : !result ? (
        <div class="json-error">
          Diff too large to render — the LCS table cap is {(250_000).toLocaleString()} cells.
          {mode === 'char' && ' Switch to line mode or shorten the inputs.'}
        </div>
      ) : mode === 'line' ? (
        <div class="diff-grid">
          {rows.map((row, idx) => {
            const lCls = !row.L ? 'empty' : row.L.t === '-' ? 'del' : ''
            const rCls = !row.R ? 'empty' : row.R.t === '+' ? 'add' : ''
            const lNum = row.L && 'ai' in row.L ? row.L.ai + 1 : ''
            const rNum = row.R && 'bi' in row.R ? row.R.bi + 1 : ''
            const lText = row.L && row.L.t !== '+' ? row.L.a : ''
            const rText = row.R && row.R.t !== '-' ? row.R.b : ''
            return (
              <>
                <div class={`gut ${lCls}`} key={`lg-${idx}`}>{lNum}</div>
                <div class={`ln ${lCls}`} key={`l-${idx}`}>{lText}</div>
                <div class={`gut ${rCls}`} key={`rg-${idx}`}>{rNum}</div>
                <div class={`ln ${rCls}`} key={`r-${idx}`}>{rText}</div>
              </>
            )
          })}
        </div>
      ) : (
        <div class="diff-inline">
          {charRuns.map((r, i) => (
            <span key={i} class={`run run-${r.t === '=' ? 'eq' : r.t === '-' ? 'del' : 'add'}`}>
              {r.value}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
