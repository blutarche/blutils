import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'text.stats',
  category: 'text',
  slug: 'stats',
  name: 'Text Statistics',
  title: 'text.stats',
  description: 'counts · reading time',
  icon: 'Sigma',
  tags: ['text', 'statistics', 'count', 'words', 'characters', 'lines', 'reading'],
  seo: {
    title: 'Text Statistics — blutils',
    description:
      'Count characters, words, lines, sentences, and paragraphs, with byte size and reading time. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [{ slug: 'word-count' }],
}
