/**
 * text.diff — side-by-side line diff.
 *
 * Two textareas top, paired diff grid below. The grid pairs every
 * removal with the next addition where possible — gives the visual
 * "this line became that line" rhythm rather than two columns of
 * isolated insertions and deletions.
 *
 * Ignore-whitespace mode normalises each line to a single-space-
 * separated trimmed string before the LCS pass. Swap exchanges the
 * two buffers in place.
 *
 * Both buffers persist via useToolInput so a reload keeps your
 * comparison set.
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

interface Row {
  L: DiffOp | null
  R: DiffOp | null
}

export default function Tool() {
  const [a, setA] = useToolInput('text.diff.a', SAMPLE_A)
  const [b, setB] = useToolInput('text.diff.b', SAMPLE_B)
  const [ignoreWs, setIgnoreWs] = useSeededState<boolean>(false)

  const result = useMemo(() => {
    const norm = (s: string): string[] =>
      ignoreWs
        ? s.split('\n').map((line) => line.replace(/\s+/g, ' ').trim())
        : s.split('\n')
    return lcsDiff(norm(a), norm(b))
  }, [a, b, ignoreWs])

  const stats = useMemo(() => {
    if (!result) return null
    return result.reduce(
      (acc, r) => {
        if (r.t === '+') acc.add++
        else if (r.t === '-') acc.del++
        else acc.eq++
        return acc
      },
      { add: 0, del: 0, eq: 0 },
    )
  }, [result])

  const rows = useMemo<Row[]>(() => {
    if (!result) return []
    const out: Row[] = []
    const pending: DiffOp[] = []
    for (const r of result) {
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
  }, [result])

  return (
    <>
      <div class="tool-head">
        <h1>text.diff</h1>
        {stats && <span class="chip ok">+{stats.add}</span>}
        {stats && <span class="chip bad">−{stats.del}</span>}
        {stats && <span class="chip">{stats.eq} unchanged</span>}
        <div style={{ flex: 1 }} />
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
      <p class="tool-sub">Line-by-line diff, side by side. LCS algorithm.</p>

      <div class="two-col" style={{ marginBottom: 14 }}>
        <div class="panel">
          <div class="panel-h">
            <span>A — original</span>
          </div>
          <textarea
            class="area bare"
            value={a}
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
            onInput={(e) => setB((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 140 }}
          />
        </div>
      </div>

      {!result ? (
        <div class="json-error">
          Diff too large to render — the LCS table cap is {(250_000).toLocaleString()} cells.
        </div>
      ) : (
        <div class="diff-grid">
          {rows.map((row, idx) => {
            const lCls = !row.L ? 'empty' : row.L.t === '-' ? 'del' : ''
            const rCls = !row.R ? 'empty' : row.R.t === '+' ? 'add' : ''
            const lNum =
              row.L && 'ai' in row.L ? row.L.ai + 1 : ''
            const rNum =
              row.R && 'bi' in row.R ? row.R.bi + 1 : ''
            const lText =
              row.L && row.L.t !== '+' ? row.L.a : ''
            const rText =
              row.R && row.R.t !== '-' ? row.R.b : ''
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
      )}
    </>
  )
}
