import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'hash.generate',
  category: 'hash',
  slug: 'generate',
  name: 'Hash Generator',
  title: 'hash.generate',
  description: 'md5 · sha-1 · sha-256 · sha-512',
  icon: 'Hash',
  tags: ['hash', 'md5', 'sha1', 'sha256', 'sha512', 'digest', 'checksum'],
  seo: {
    title: 'Hash Generator — blutils',
    description:
      'Compute MD5, SHA-1, SHA-256, and SHA-512 digests in the browser via SubtleCrypto. Local-only.',
  },
  status: 'stable',
  aliases: [
    { slug: 'md5' },
    { slug: 'sha1' },
    { slug: 'sha256' },
    { slug: 'sha512' },
  ],
}
