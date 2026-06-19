import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'text.slug',
  category: 'text',
  slug: 'slug',
  name: 'Slugify',
  title: 'text.slug',
  description: 'url-safe slugs',
  icon: 'Link2',
  tags: ['slug', 'slugify', 'url', 'kebab', 'permalink', 'seo'],
  seo: {
    title: 'Slugify — blutils',
    description:
      'Turn any text into a clean, url-safe slug. Strips accents, lowercases, and collapses punctuation. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
