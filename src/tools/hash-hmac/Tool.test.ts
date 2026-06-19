import { describe, expect, it } from 'vitest'
import { bytesToHex, hexToBytes, hmac } from './engine'

/**
 * Test vectors are the published ones from RFC 4231 (HMAC-SHA-256
 * and HMAC-SHA-512 test cases 1 and 2).
 */

describe('hmac — RFC 4231 vectors', () => {
  it('SHA-256 case 1 (20 bytes of 0x0b, "Hi There")', async () => {
    const key = '0b'.repeat(20)
    const out = await hmac('Hi There', key, 'SHA-256', { keyEncoding: 'hex' })
    expect(out).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    )
  })

  it('SHA-256 case 2 (key "Jefe")', async () => {
    const out = await hmac(
      'what do ya want for nothing?',
      'Jefe',
      'SHA-256',
      { keyEncoding: 'utf-8' },
    )
    expect(out).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    )
  })

  it('SHA-512 case 1 (20 bytes of 0x0b, "Hi There")', async () => {
    const key = '0b'.repeat(20)
    const out = await hmac('Hi There', key, 'SHA-512', { keyEncoding: 'hex' })
    expect(out).toBe(
      '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cde' +
        'daa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
    )
  })

  it('SHA-512 case 2 (key "Jefe")', async () => {
    const out = await hmac(
      'what do ya want for nothing?',
      'Jefe',
      'SHA-512',
      { keyEncoding: 'utf-8' },
    )
    expect(out).toBe(
      '164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea250554' +
        '9758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737',
    )
  })

  it('renders base64 output (SHA-256 case 1)', async () => {
    const key = '0b'.repeat(20)
    const out = await hmac('Hi There', key, 'SHA-256', {
      keyEncoding: 'hex',
      output: 'base64',
    })
    // base64 of the case-1 SHA-256 digest above.
    expect(out).toBe('sDRMYdjbOFNcqK/OrwvxK4gdwgDJgz2nJuk3bC4yz/c=')
  })
})

describe('hexToBytes / bytesToHex', () => {
  it('round-trips', () => {
    const hex = '0b0b0b1234ff00'
    expect(bytesToHex(hexToBytes(hex))).toBe(hex)
  })

  it('throws on odd-length hex', () => {
    expect(() => hexToBytes('abc')).toThrow()
  })

  it('throws on non-hex characters', () => {
    expect(() => hexToBytes('zz')).toThrow()
  })
})
