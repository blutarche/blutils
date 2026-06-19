/**
 * time.timezone — convert one instant across IANA time zones.
 *
 * Pick a source wall-clock date/time and its zone; the component
 * resolves that to an absolute instant (epoch ms) and renders the
 * matching wall-clock + UTC offset for each target zone. UTC and
 * the browser's local zone are pinned into the picker so they're
 * always one click away.
 *
 * All instant math lives in the dep-free engine (getParts /
 * offsetMinutes / formatInZone); this file only owns state, the
 * datetime-local ↔ epoch bridge, and layout. The clock is read
 * once at mount to seed the default — never inside the engine.
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import {
  formatInZone,
  formatOffset,
  getParts,
  listZones,
  offsetMinutes,
} from './engine'

const ZONES = listZones()
const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Zones offered as quick-add targets, deduped against existing picks. */
const DEFAULT_TARGETS = ['UTC', LOCAL_ZONE, 'America/New_York', 'Asia/Tokyo']

export default function Tool() {
  // `datetime-local` value (no zone, no seconds) seeded from now.
  const [local, setLocal] = useState<string>(() => toLocalInput(new Date()))
  const [sourceZone, setSourceZone] = useState<string>(LOCAL_ZONE)
  const [targets, setTargets] = useState<string[]>(() =>
    dedupe(DEFAULT_TARGETS),
  )

  // The absolute instant: interpret the entered wall-clock as a
  // time in the chosen source zone, then resolve to epoch ms.
  const epochMs = useMemo(
    () => wallClockToEpoch(local, sourceZone),
    [local, sourceZone],
  )

  const valid = epochMs !== null

  const addTarget = (z: string) => {
    setTargets((prev) => (prev.includes(z) ? prev : [...prev, z]))
  }
  const removeTarget = (z: string) => {
    setTargets((prev) => prev.filter((t) => t !== z))
  }

  return (
    <>
      <div class="tool-head">
        <h1>time.timezone</h1>
        <span class="chip">
          <Icon name="Globe" size={11} /> {ZONES.length} zones
        </span>
        <div style={{ flex: 1 }} />
      </div>
      <p class="tool-sub">
        Convert one instant across time zones. UTC offsets reflect DST.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>source</span>
          <span class="actions">
            <button
              class="btn ghost sm"
              type="button"
              onClick={() => setLocal(toLocalInput(new Date()))}
            >
              <Icon name="Clock" size={11} /> now
            </button>
          </span>
        </div>
        <div class="panel-b">
          <div class="two-col">
            <input
              class="input"
              type="datetime-local"
              step={1}
              value={local}
              onInput={(e) =>
                setLocal((e.target as HTMLInputElement).value)
              }
            />
            <select
              class="input"
              value={sourceZone}
              onInput={(e) =>
                setSourceZone((e.target as HTMLSelectElement).value)
              }
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>add zone</span>
        </div>
        <div class="panel-b">
          <select
            class="input"
            value=""
            onInput={(e) => {
              const z = (e.target as HTMLSelectElement).value
              if (z) addTarget(z)
              ;(e.target as HTMLSelectElement).value = ''
            }}
          >
            <option value="">+ add a target zone…</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>converted</span>
        </div>
        <div class="panel-b">
          {!valid && (
            <div style={{ color: 'var(--muted)' }}>enter a valid date/time</div>
          )}
          {valid && (
            <dl class="kv">
              {targets.map((z) => {
                const parts = getParts(epochMs, z)
                const off = offsetMinutes(epochMs, z)
                const wall = formatInZone(epochMs, z, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hourCycle: 'h23',
                })
                const wd = WEEKDAYS[weekdayUtc(parts)]
                return (
                  <>
                    <dt key={`${z}-dt`}>
                      {z}
                      {z === sourceZone ? ' ·src' : ''}
                    </dt>
                    <dd key={`${z}-dd`}>
                      <span>{wall}</span>{' '}
                      <span style={{ color: 'var(--muted)' }}>
                        ({wd} · UTC{formatOffset(off)})
                      </span>{' '}
                      <button
                        class="btn ghost sm"
                        type="button"
                        onClick={() => removeTarget(z)}
                        title="remove"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    </dd>
                  </>
                )
              })}
            </dl>
          )}
        </div>
      </div>
    </>
  )
}

/** Drop duplicate zones while keeping first-seen order. */
function dedupe(zones: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const z of zones) {
    if (seen.has(z)) continue
    seen.add(z)
    out.push(z)
  }
  return out
}

/** A `Date` → `datetime-local` value ("YYYY-MM-DDTHH:mm:ss") in host-local time. */
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  )
}

/**
 * Resolve a wall-clock string ("YYYY-MM-DDTHH:mm[:ss]") interpreted
 * in `zone` to an absolute epoch in ms, or null if unparseable.
 *
 * There's no "make a Date from civil time in zone Z" primitive, so
 * we treat the fields as if they were UTC to get a guess instant,
 * measure `zone`'s offset there, and subtract it. One refinement
 * pass handles the case where the offset itself changes across the
 * guess (DST boundaries); a second measure converges.
 */
function wallClockToEpoch(value: string, zone: string): number | null {
  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  const asUtc = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    s ? Number(s) : 0,
  )
  if (Number.isNaN(asUtc)) return null
  const off1 = offsetMinutes(asUtc, zone)
  const guess = asUtc - off1 * 60000
  const off2 = offsetMinutes(guess, zone)
  return asUtc - off2 * 60000
}

/** UTC weekday index (0=Sun) of a zone's wall-clock parts. */
function weekdayUtc(p: {
  year: number
  month: number
  day: number
}): number {
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
}
