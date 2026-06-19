import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.hashid',
  category: 'inspect',
  slug: 'hash-id',
  name: 'Hash Identifier',
  title: 'hash.identify',
  description: 'guess hash type',
  icon: 'Hash',
  tags: ['hash', 'identify', 'md5', 'sha', 'bcrypt', 'digest', 'crack'],
  seo: {
    title: 'Hash Identifier — blutils',
    description:
      'Guess the algorithm behind a hash or password digest from its shape — bcrypt, Argon2, crypt schemes, and pure-hex digests like MD5/SHA. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
