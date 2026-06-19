import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'text.lines',
  category: 'text',
  slug: 'lines',
  name: 'Line Tools',
  title: 'text.lines',
  description: 'sort · unique · trim · reverse',
  icon: 'List',
  tags: ['lines', 'sort', 'unique', 'dedupe', 'trim', 'reverse', 'filter'],
  seo: {
    title: 'Line Tools — sort, dedupe, trim — blutils',
    description:
      'Sort, dedupe, trim, reverse, and filter lines of text in the browser. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
