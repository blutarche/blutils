/**
 * inspect.http — HTTP status code reference.
 *
 * A search box over the static STATUS_CODES table. Results are
 * grouped by class (Informational → Server Error) and rendered as a
 * list of code · phrase · meaning rows. When the query is an exact
 * 3-digit code that exists in the table, that row is flagged so it
 * stands out from prefix siblings (e.g. "404" among the 40x rows).
 *
 * The query persists via useToolInput so a reload keeps the lookup.
 * There is no detect.ts or ops.ts on purpose: a bare 3-digit number
 * would over-match the clipboard Detector and Chain pipelines.
 */

import { useMemo } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import {
  classOf,
  lookup,
  search,
  type StatusClass,
  type StatusCode,
} from './engine'

/** Render order for the grouped sections. */
const CLASS_ORDER: StatusClass[] = [
  'Informational',
  'Success',
  'Redirection',
  'Client Error',
  'Server Error',
]

export default function Tool() {
  const [query, setQuery] = useToolInput('inspect.http.query', '')

  const results = useMemo(() => search(query), [query])

  /** The single row to highlight, when the query is an exact code. */
  const exactCode = useMemo(() => {
    const q = query.trim()
    return /^\d{3}$/.test(q) && lookup(Number(q)) ? Number(q) : null
  }, [query])

  const groups = useMemo(() => {
    const byClass = new Map<StatusClass, StatusCode[]>()
    for (const s of results) {
      const label = classOf(s.code)
      if (!label) continue
      const bucket = byClass.get(label) ?? []
      bucket.push(s)
      byClass.set(label, bucket)
    }
    return CLASS_ORDER.filter((c) => byClass.has(c)).map((c) => ({
      label: c,
      codes: byClass.get(c)!,
    }))
  }, [results])

  return (
    <>
      <div class="tool-head">
        <h1>http.status</h1>
        <span class="chip ok">
          {results.length} code{results.length === 1 ? '' : 's'}
        </span>
      </div>
      <p class="tool-sub">
        Search by code (e.g. 404), reason phrase, or meaning.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>search</span>
          {query && (
            <span class="actions">
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => setQuery('')}
              >
                clear
              </button>
            </span>
          )}
        </div>
        <div
          class="panel-b"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Icon name="Search" size={13} />
          <input
            class="input bare"
            value={query}
            placeholder="404, not found, teapot…"
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            spellcheck={false}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <div class="panel">
          <div class="panel-b">
            <div class="palette-empty" style={{ padding: 20 }}>
              no matching status codes
            </div>
          </div>
        </div>
      ) : (
        groups.map((group) => (
          <div class="panel" key={group.label} style={{ marginBottom: 14 }}>
            <div class="panel-h">
              <span>{group.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                {group.codes.length}
              </span>
            </div>
            <div class="panel-b">
              {group.codes.map((s, i) => (
                <div
                  key={s.code}
                  style={{
                    padding: '8px 0',
                    borderTop: i ? '1px dashed var(--line)' : 0,
                  }}
                >
                  <div
                    style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}
                  >
                    <span
                      class={`chip${s.code === exactCode ? ' ok' : ''}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {s.code}
                    </span>
                    <span style={{ fontWeight: 600 }}>{s.message}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      marginLeft: 2,
                      color: 'var(--muted)',
                      fontSize: 12.5,
                    }}
                  >
                    {s.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  )
}
