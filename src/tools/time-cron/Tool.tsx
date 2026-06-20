/**
 * time.cron — cron expression parser and next-run preview.
 *
 * 5-field syntax (minute hour day-of-month month day-of-week).
 * The expression input persists via useToolInput. Preset chips
 * underneath fill the input with common schedules — handy for
 * remembering the shape of "every 15 minutes" or "weekdays at 9am"
 * without reading a manual.
 *
 * Explanation block paraphrases the expression in English; the
 * runs panel lists the next six fire times with a relative label.
 * Both fall back to error / empty states when the input doesn't
 * parse.
 */

import { useMemo } from 'preact/hooks'
import { useToolInput } from '../../storage/use-tool-input'
import { cronExplain, nextRuns } from './cron'

const PRESETS: ReadonlyArray<readonly [string, string]> = [
  ['* * * * *', 'every minute'],
  ['*/15 * * * *', 'every 15 min'],
  ['0 * * * *', 'hourly'],
  ['0 9 * * 1-5', 'weekdays @ 9am'],
  ['30 2 * * 0', 'sun @ 2:30am'],
  ['0 0 1 * *', '1st of month'],
]

export default function Tool() {
  const [expr, setExpr] = useToolInput('time.cron', '')

  const isEmpty = expr.trim() === ''
  const parts = useMemo(() => expr.trim().split(/\s+/), [expr])
  const valid = parts.length === 5
  const explanation = useMemo(
    () => (valid ? cronExplain(parts) : null),
    [valid, parts],
  )
  const next = useMemo(() => (valid ? nextRuns(parts, 6) : []), [valid, parts])

  return (
    <>
      <div class="tool-head">
        <h1>cron.parse</h1>
        {isEmpty ? null : valid && explanation ? (
          <span class="chip ok">valid</span>
        ) : (
          <span class="chip bad">
            {parts.length} field{parts.length === 1 ? '' : 's'}, need 5
          </span>
        )}
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">
        5-field cron: minute · hour · day-of-month · month · day-of-week.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>expression</span>
        </div>
        <div class="panel-b">
          <input
            class="input"
            value={expr}
            placeholder="* * * * *"
            onInput={(e) => setExpr((e.target as HTMLInputElement).value)}
            spellcheck={false}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {PRESETS.map(([e, lbl]) => (
              <button
                key={e}
                type="button"
                class="chip"
                onClick={() => setExpr(e)}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {explanation && (
        <div class="cron-explain" style={{ marginBottom: 14 }}>
          <b>↳</b> {explanation}
        </div>
      )}

      <div class="panel">
        <div class="panel-h">
          <span>next 6 runs</span>
        </div>
        <div class="panel-b">
          {isEmpty ? (
            <div class="tool-empty">Enter an expression or pick a preset.</div>
          ) : (
            <ol class="cron-runs">
              {next.map((d, i) => {
                const minsAhead = Math.round((d.getTime() - Date.now()) / 60_000)
                const rel =
                  minsAhead < 60
                    ? `in ${minsAhead} min`
                    : minsAhead < 1440
                      ? `in ${Math.round(minsAhead / 60)} hr`
                      : `in ${Math.round(minsAhead / 1440)} d`
                return (
                  <li key={i}>
                    <span class="rn">#{i + 1}</span>
                    <span class="rt">
                      {d.toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span class="rd">{rel}</span>
                  </li>
                )
              })}
              {!next.length && (
                <li style={{ display: 'block', color: 'var(--muted)' }}>parse error</li>
              )}
            </ol>
          )}
        </div>
      </div>
    </>
  )
}
