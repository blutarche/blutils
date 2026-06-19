import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'hash.hmac',
  category: 'hash',
  slug: 'hmac',
  name: 'HMAC',
  title: 'hash.hmac',
  description: 'HMAC · SHA-256 / 384 / 512',
  icon: 'KeyRound',
  tags: ['hmac', 'mac', 'hash', 'sign', 'signature', 'sha256', 'secret', 'key'],
  seo: {
    title: 'HMAC Generator — blutils',
    description:
      'Compute HMAC-SHA-256/384/512 in the browser via SubtleCrypto, with hex/base64 keys and output. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
