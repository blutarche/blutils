/**
 * time.timezone — pure date/time-zone conversion engine.
 *
 * Deterministic and DOM-free: every function takes an explicit
 * epoch-millisecond instant and never reads the clock, so the same
 * inputs always produce the same output and the unit tests can pin
 * a fixed epoch. The runtime ships the IANA tz database via the
 * built-in `Intl` API, so there's no tz library and no network.
 *
 * The two primitives are `getParts` (the wall-clock fields a zone
 * shows at an instant) and `offsetMinutes` (that zone's UTC offset
 * at the instant, which is what makes DST observable). Everything
 * else — formatted strings, the zone list — is a thin wrapper.
 */

/** Wall-clock fields a zone displays at a given instant (24-hour). */
export interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/**
 * The numeric wall-clock parts a `timeZone` shows at `epochMs`.
 *
 * Uses `Intl.DateTimeFormat.formatToParts` with numeric, 24-hour
 * fields. `hourCycle: 'h23'` keeps midnight as 0 rather than the
 * `24` some engines emit under the older `hour12: false`.
 */
export function getParts(epochMs: number, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const map: Record<string, number> = {}
  for (const p of fmt.formatToParts(new Date(epochMs))) {
    if (p.type !== 'literal') map[p.type] = Number(p.value)
  }
  return {
    year: map.year ?? 0,
    month: map.month ?? 0,
    day: map.day ?? 0,
    hour: map.hour ?? 0,
    minute: map.minute ?? 0,
    second: map.second ?? 0,
  }
}

/**
 * The UTC offset, in minutes, that `timeZone` observes at
 * `epochMs`. Positive is east of UTC (e.g. Tokyo = +540).
 *
 * Rather than parsing a "GMT+9" label across locales, we compare
 * the zone's wall-clock parts to UTC's wall-clock parts for the
 * same instant: the signed difference between those two civil
 * times is exactly the offset. This is locale-independent and
 * naturally reflects DST because both sides are read at `epochMs`.
 */
export function offsetMinutes(epochMs: number, timeZone: string): number {
  const local = getParts(epochMs, timeZone)
  const utc = getParts(epochMs, 'UTC')
  const asUtcMs = (p: ZonedParts) =>
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtcMs(local) - asUtcMs(utc)) / 60000)
}

/**
 * A formatted wall-clock string for `timeZone` at `epochMs`.
 *
 * Defaults to a medium date + medium time; callers can override
 * via `opts` (any `Intl.DateTimeFormatOptions`). The `timeZone` is
 * always forced from the argument so the output is independent of
 * the host's local zone.
 */
export function formatInZone(
  epochMs: number,
  timeZone: string,
  opts: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'medium',
  },
): string {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone }).format(
    new Date(epochMs),
  )
}

/** "+05:30" / "-04:00" / "+00:00" rendering of a minute offset. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

/**
 * Minimal IANA fallback used only when the runtime lacks
 * `Intl.supportedValuesOf`. Spans the offset range so the picker
 * is still useful; modern engines never hit this path.
 */
const FALLBACK_ZONES: readonly string[] = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

/**
 * Every IANA zone the runtime knows, via `Intl.supportedValuesOf`.
 * Wrapped because the method is optional in the type lib and may
 * be absent on older engines, in which case we return the small
 * built-in list above.
 *
 * `'UTC'` is guaranteed present and hoisted to the front: the spec
 * lists the canonical zone as `'Etc/UTC'`, but the bare `'UTC'`
 * alias is universally accepted by `Intl` and is what the UI pins
 * as a default target, so the picker must offer it too.
 */
export function listZones(): string[] {
  const supported = (
    Intl as unknown as {
      supportedValuesOf?: (key: string) => string[]
    }
  ).supportedValuesOf
  let zones: string[] = [...FALLBACK_ZONES]
  if (typeof supported === 'function') {
    try {
      const got = supported('timeZone')
      if (Array.isArray(got) && got.length > 0) zones = got
    } catch {
      // keep the static fallback list
    }
  }
  return ['UTC', ...zones.filter((z) => z !== 'UTC')]
}
