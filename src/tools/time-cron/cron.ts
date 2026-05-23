/**
 * Cron expression parser + next-run computer.
 *
 * 5-field cron: minute (0–59), hour (0–23), day-of-month (1–31),
 * month (1–12), day-of-week (0–6, Sun=0). Supports `*`, lists
 * (`1,2,3`), ranges (`1-5`), steps (`*\/15`, `0-10/2`), and any
 * combination. Field parser is exposed in case Detectors or Ops
 * want to validate cron candidates without invoking the Tool UI.
 *
 * nextRuns walks one minute at a time. The 525960 ceiling is one
 * year — enough headroom for sparse schedules ("yearly on Feb 29"
 * etc.) without locking the thread on pathological inputs.
 */

export function parseField(f: string, min: number, max: number): number[] {
  if (f === '*') {
    const out: number[] = []
    for (let i = min; i <= max; i++) out.push(i)
    return out
  }
  const set = new Set<number>()
  for (const part of f.split(',')) {
    let step = 1
    let range = part
    if (part.includes('/')) {
      const [r, s] = part.split('/')
      range = r === '' ? '*' : r!
      step = parseInt(s!, 10)
    }
    let lo: number
    let hi: number
    if (range === '*') {
      lo = min
      hi = max
    } else if (range.includes('-')) {
      const [a, b] = range.split('-').map(Number) as [number, number]
      lo = a
      hi = b
    } else {
      lo = parseInt(range, 10)
      hi = lo
    }
    if (Number.isNaN(lo) || Number.isNaN(hi) || Number.isNaN(step) || step <= 0) {
      throw new Error(`bad field: ${f}`)
    }
    for (let i = lo; i <= hi; i += step) set.add(i)
  }
  return [...set].sort((a, b) => a - b)
}

const MONTHS = [
  null,
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function describe(
  field: string,
  values: number[],
  names?: ReadonlyArray<string | null>,
): string | null {
  if (field === '*') return null
  if (names) return values.map((i) => names[i]!).join(', ')
  if (values.length === 1) return String(values[0])
  if (field.startsWith('*/')) return `every ${field.slice(2)}`
  return values.join(',')
}

export function cronExplain(parts: string[]): string | null {
  if (parts.length !== 5) return null
  try {
    const [m, h, dom, mon, dow] = parts as [string, string, string, string, string]
    const mins = parseField(m, 0, 59)
    const hrs = parseField(h, 0, 23)
    const doms = parseField(dom, 1, 31)
    const mons = parseField(mon, 1, 12)
    const dows = parseField(dow, 0, 6)
    const bits: string[] = []
    bits.push(`At minute ${describe(m, mins) ?? 'every'}`)
    if (h !== '*') bits.push(`past hour ${describe(h, hrs)}`)
    else if (m !== '*') bits.push('of every hour')
    if (dom !== '*') bits.push(`on day ${describe(dom, doms)}`)
    if (mon !== '*') bits.push(`in ${describe(mon, mons, MONTHS)}`)
    if (dow !== '*') bits.push(`on ${describe(dow, dows, DOWS)}`)
    return bits.join(' ') + '.'
  } catch {
    return null
  }
}

export function nextRuns(parts: string[], count = 6): Date[] {
  if (parts.length !== 5) return []
  try {
    const [m, h, dom, mon, dow] = parts as [string, string, string, string, string]
    const mins = parseField(m, 0, 59)
    const hrs = parseField(h, 0, 23)
    const doms = parseField(dom, 1, 31)
    const mons = parseField(mon, 1, 12)
    const dows = parseField(dow, 0, 6)
    const out: Date[] = []
    let d = new Date()
    d.setSeconds(0, 0)
    d = new Date(d.getTime() + 60_000)
    let safety = 0
    while (out.length < count && safety++ < 525_960) {
      if (
        mins.includes(d.getMinutes()) &&
        hrs.includes(d.getHours()) &&
        doms.includes(d.getDate()) &&
        mons.includes(d.getMonth() + 1) &&
        dows.includes(d.getDay())
      ) {
        out.push(new Date(d))
      }
      d = new Date(d.getTime() + 60_000)
    }
    return out
  } catch {
    return []
  }
}
