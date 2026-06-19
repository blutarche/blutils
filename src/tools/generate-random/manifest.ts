import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'generate.random',
  category: 'generate',
  slug: 'random',
  name: 'Random String',
  title: 'random.string',
  description: 'tokens · custom charset · CSPRNG',
  icon: 'Dices',
  tags: ['random', 'token', 'nonce', 'string', 'id', 'key', 'secret'],
  seo: {
    title: 'Random String Generator — blutils',
    description:
      'Generate random strings and tokens from a custom character set using the browser CSPRNG. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [{ slug: 'token' }],
}
