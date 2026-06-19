import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'generate.uuid',
  category: 'generate',
  slug: 'uuid',
  name: 'UUID',
  title: 'uuid.v4',
  description: 'v4 · random · RFC 9562',
  icon: 'IdCard',
  tags: ['uuid', 'guid', 'v4', 'id', 'identifier', 'random'],
  seo: {
    title: 'UUID Generator (v4) — blutils',
    description:
      'Generate random version 4 UUIDs (RFC 9562) in the browser. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [{ slug: 'guid' }],
}
