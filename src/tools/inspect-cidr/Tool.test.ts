import { describe, expect, it } from 'vitest'
import { intToIp, ipToInt, parseCidr } from './engine'

describe('ipToInt / intToIp', () => {
  it('round-trips a dotted address', () => {
    expect(intToIp(ipToInt('192.168.1.10'))).toBe('192.168.1.10')
    expect(intToIp(ipToInt('0.0.0.0'))).toBe('0.0.0.0')
    expect(intToIp(ipToInt('255.255.255.255'))).toBe('255.255.255.255')
  })

  it('produces unsigned values for high addresses', () => {
    // 255.255.255.255 must be 2³²-1, not -1 (signed int32).
    expect(ipToInt('255.255.255.255')).toBe(4294967295)
  })

  it('throws on an out-of-range octet', () => {
    expect(() => ipToInt('192.168.1.256')).toThrow()
  })

  it('throws on the wrong octet count', () => {
    expect(() => ipToInt('192.168.1')).toThrow()
  })
})

describe('parseCidr — 192.168.1.10/24', () => {
  const r = parseCidr('192.168.1.10/24')

  it('computes the network and broadcast', () => {
    expect(r.network).toBe('192.168.1.0')
    expect(r.broadcast).toBe('192.168.1.255')
  })

  it('computes the masks', () => {
    expect(r.netmask).toBe('255.255.255.0')
    expect(r.wildcard).toBe('0.0.0.255')
  })

  it('computes the host range', () => {
    expect(r.firstHost).toBe('192.168.1.1')
    expect(r.lastHost).toBe('192.168.1.254')
  })

  it('counts addresses and usable hosts', () => {
    expect(r.totalAddresses).toBe(256)
    expect(r.usableHosts).toBe(254)
  })

  it('flags the block as private', () => {
    expect(r.isPrivate).toBe(true)
  })
})

describe('parseCidr — prefix edge cases', () => {
  it('treats a bare IP as /32 with a single usable host', () => {
    const r = parseCidr('8.8.8.8')
    expect(r.prefix).toBe(32)
    expect(r.network).toBe('8.8.8.8')
    expect(r.broadcast).toBe('8.8.8.8')
    expect(r.netmask).toBe('255.255.255.255')
    expect(r.totalAddresses).toBe(1)
    expect(r.usableHosts).toBe(1)
    expect(r.firstHost).toBe('8.8.8.8')
    expect(r.lastHost).toBe('8.8.8.8')
  })

  it('treats /31 as a 2-host point-to-point link (RFC 3021)', () => {
    const r = parseCidr('10.0.0.0/31')
    expect(r.totalAddresses).toBe(2)
    expect(r.usableHosts).toBe(2)
    expect(r.firstHost).toBe('10.0.0.0')
    expect(r.lastHost).toBe('10.0.0.1')
  })

  it('handles /0 (the whole space)', () => {
    const r = parseCidr('0.0.0.0/0')
    expect(r.netmask).toBe('0.0.0.0')
    expect(r.broadcast).toBe('255.255.255.255')
    expect(r.totalAddresses).toBe(4294967296)
    expect(r.usableHosts).toBe(4294967294)
  })
})

describe('parseCidr — private vs public', () => {
  it('marks 10.0.0.0/8 private', () => {
    expect(parseCidr('10.0.0.0/8').isPrivate).toBe(true)
  })

  it('marks 8.8.8.8/32 public', () => {
    expect(parseCidr('8.8.8.8/32').isPrivate).toBe(false)
  })
})

describe('parseCidr — validation', () => {
  it('throws on an octet of 256', () => {
    expect(() => parseCidr('192.168.1.256/24')).toThrow()
  })

  it('throws on a prefix above 32', () => {
    expect(() => parseCidr('192.168.1.0/33')).toThrow()
  })

  it('throws on empty input', () => {
    expect(() => parseCidr('   ')).toThrow()
  })
})
