/**
 * time.unix — live Unix timestamp, two-way converter.
 *
 * Header panel ticks every second showing the current epoch with
 * thin-space digit grouping, the UTC date / time / weekday, and
 * the local-zone clock for sanity. A pause button stops the
 * interval so you can copy a stable value.
 *
 * Two converters underneath:
 *   - unix → date: numeric input, derives ISO 8601 / RFC 2822 /
 *     locale-formatted / relative ("3m ago", "in 2d") strings.
 *   - date → unix: ISO-ish string input, parses with `new Date`,
 *     reports seconds / millis / micros / weekday.
 *
 * Both panels share a single timestamp state so editing one
 * updates the other. The two-way wiring lets you paste a date
 * and read back its epoch, or vice versa, without losing focus.
 */

import { useEffect, useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { copyText } from '../../clipboard/copy'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Tool() {
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000))
  const [paused, setPaused] = useState(false)
  const [ts, setTs] = useState<number>(1712045600)
  const [dt, setDt] = useState<string>(() =>
    new Date(1712045600 * 1000).toISOString(),
  )

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000,
    )
    return () => window.clearInterval(id)
  }, [paused])

  useEffect(() => {
    setDt(new Date(ts * 1000).toISOString())
  }, [ts])

  const nowDate = useMemo(() => new Date(now * 1000), [now])

  const copy = (s: string) => {
    copyText(s)
  }

  return (
    <>
      <div class="tool-head">
        <h1>unix.time</h1>
        <span class="chip">UTC</span>
        <div style={{ flex: 1 }} />
        <button class="btn ghost sm" type="button" onClick={() => setPaused((p) => !p)}>
          <Icon name={paused ? 'Play' : 'Pause'} size={11} />
          {paused ? 'resume' : 'pause'}
        </button>
      </div>
      <p class="tool-sub">
        Live timestamp updates every second. Convert in either direction.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>now</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={() => copy(String(now))}>
              <Icon name="Copy" size={11} /> copy
            </button>
          </span>
        </div>
        <div class="panel-b">
          <div class="now-stamp">{groupDigits(now)}</div>
          <div class="now-row">
            <span>
              <b>{nowDate.toISOString().slice(0, 10)}</b>
            </span>
            <span>{nowDate.toISOString().slice(11, 19)} UTC</span>
            <span>{WEEKDAYS[nowDate.getUTCDay()]}</span>
            <span>
              local:{' '}
              <b>
                {new Date(now * 1000).toLocaleString(undefined, {
                  timeStyle: 'medium',
                })}
              </b>
            </span>
          </div>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>unix → date</span>
          </div>
          <div class="panel-b">
            <input
              class="input"
              type="number"
              value={ts}
              onInput={(e) =>
                setTs(parseInt((e.target as HTMLInputElement).value, 10) || 0)
              }
            />
            <div style={{ height: 8 }} />
            <dl class="kv">
              <dt>ISO 8601</dt>
              <dd>{formatTs(ts, 'iso')}</dd>
              <dt>RFC 2822</dt>
              <dd>{formatTs(ts, 'rfc')}</dd>
              <dt>Local</dt>
              <dd>{formatTs(ts, 'local')}</dd>
              <dt>Relative</dt>
              <dd>{formatTs(ts, 'rel')}</dd>
            </dl>
          </div>
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>date → unix</span>
          </div>
          <div class="panel-b">
            <input
              class="input"
              value={dt}
              onInput={(e) => {
                const v = (e.target as HTMLInputElement).value
                setDt(v)
                const parsed = new Date(v).getTime()
                if (!Number.isNaN(parsed)) setTs(Math.floor(parsed / 1000))
              }}
            />
            <div style={{ height: 8 }} />
            <dl class="kv">
              <dt>seconds</dt>
              <dd>{ts}</dd>
              <dt>millis</dt>
              <dd>{ts * 1000}</dd>
              <dt>micros</dt>
              <dd>{ts * 1_000_000}</dd>
              <dt>weekday</dt>
              <dd>{WEEKDAYS[new Date(ts * 1000).getUTCDay()]}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}

function groupDigits(n: number): string {
  // Thin-space digit grouping for the live clock display.
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

type FormatKind = 'iso' | 'rfc' | 'local' | 'rel'

function formatTs(s: number, kind: FormatKind): string {
  const d = new Date(s * 1000)
  if (Number.isNaN(d.getTime())) return '—'
  if (kind === 'iso') return d.toISOString()
  if (kind === 'rfc') return d.toUTCString()
  if (kind === 'local')
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    })
  // relative
  const diff = Math.floor(Date.now() / 1000) - s
  const abs = Math.abs(diff)
  const tense = (after: string, before: string) =>
    diff >= 0 ? `${after} ago` : `in ${before}`
  if (abs < 60) return tense(`${abs}s`, `${abs}s`)
  if (abs < 3600) {
    const m = Math.floor(abs / 60)
    return tense(`${m}m`, `${m}m`)
  }
  if (abs < 86400) {
    const h = Math.floor(abs / 3600)
    return tense(`${h}h`, `${h}h`)
  }
  const days = Math.floor(abs / 86400)
  return tense(`${days}d`, `${days}d`)
}
