import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.basex',
  category: 'encode',
  slug: 'base32',
  name: 'Base32 / Base58',
  title: 'base32.base58',
  description: 'RFC 4648 base32 · base58 (btc)',
  icon: 'Binary',
  tags: ['base32', 'base58', 'encode', 'decode', 'bitcoin', 'rfc4648'],
  seo: {
    title: 'Base32 & Base58 Encoder / Decoder — blutils',
    description:
      'Encode and decode Base32 (RFC 4648) and Bitcoin Base58 in the browser. UTF-8 round-trip, local-only — nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [{ slug: 'base58', initialState: { scheme: 'base58' } }],
}
