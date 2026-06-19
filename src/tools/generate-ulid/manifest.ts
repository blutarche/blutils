import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'generate.ulid',
  category: 'generate',
  slug: 'ulid',
  name: 'ULID',
  title: 'generate.ulid',
  description: 'sortable · Crockford base32',
  icon: 'ScanLine',
  tags: ['ulid', 'id', 'identifier', 'sortable', 'timestamp', 'base32'],
  seo: {
    title: 'ULID Generator — blutils',
    description:
      'Generate sortable ULIDs (48-bit timestamp + 80-bit randomness, Crockford base32) in the browser. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
