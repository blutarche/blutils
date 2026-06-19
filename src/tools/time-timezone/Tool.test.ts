import { describe, expect, it } from 'vitest'
import {
  formatInZone,
  formatOffset,
  getParts,
  listZones,
  offsetMinutes,
} from './engine'

// 2023-11-14T22:13:20.000Z — a fixed instant so every assertion is
// deterministic. November means the US is on standard time and the
// southern hemisphere on summer time, which keeps the DST cases honest.
const EPOCH = 1700000000000

describe('getParts', () => {
  it('reads UTC wall-clock fields at a fixed instant', () => {
    expect(getParts(EPOCH, 'UTC')).toEqual({
      year: 2023,
      month: 11,
      day: 14,
      hour: 22,
      minute: 13,
      second: 20,
    })
  })

  it('shifts the civil date forward for Tokyo (+9)', () => {
    // 22:13 UTC + 9h = 07:13 the next calendar day.
    expect(getParts(EPOCH, 'Asia/Tokyo')).toEqual({
      year: 2023,
      month: 11,
      day: 15,
      hour: 7,
      minute: 13,
      second: 20,
    })
  })

  it('shifts back for New York (EST, -5 in November)', () => {
    // 22:13 UTC - 5h = 17:13 same day.
    expect(getParts(EPOCH, 'America/New_York')).toEqual({
      year: 2023,
      month: 11,
      day: 14,
      hour: 17,
      minute: 13,
      second: 20,
    })
  })
})

describe('offsetMinutes', () => {
  it('is 0 for UTC', () => {
    expect(offsetMinutes(EPOCH, 'UTC')).toBe(0)
  })

  it('is +540 for Tokyo (no DST)', () => {
    expect(offsetMinutes(EPOCH, 'Asia/Tokyo')).toBe(540)
  })

  it('is -300 for New York on standard time', () => {
    expect(offsetMinutes(EPOCH, 'America/New_York')).toBe(-300)
  })

  it('reflects DST: India is a fixed +330 half-hour offset', () => {
    expect(offsetMinutes(EPOCH, 'Asia/Kolkata')).toBe(330)
  })
})

describe('formatOffset', () => {
  it('renders zero, positive, and negative offsets with padding', () => {
    expect(formatOffset(0)).toBe('+00:00')
    expect(formatOffset(540)).toBe('+09:00')
    expect(formatOffset(330)).toBe('+05:30')
    expect(formatOffset(-300)).toBe('-05:00')
  })
})

describe('formatInZone', () => {
  it('formats the same instant differently per zone', () => {
    const utc = formatInZone(EPOCH, 'UTC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    expect(utc).toBe('11/14/2023, 22:13:20')

    const tokyo = formatInZone(EPOCH, 'Asia/Tokyo', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    expect(tokyo).toBe('11/15/2023, 07:13:20')
  })
})

describe('listZones', () => {
  it('returns a non-empty list that includes UTC', () => {
    const zones = listZones()
    expect(zones.length).toBeGreaterThan(0)
    expect(zones).toContain('UTC')
  })
})
