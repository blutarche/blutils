import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'format.json',
  category: 'format',
  slug: 'json',
  name: 'JSON Format',
  title: 'json.format',
  description: 'validate & beautify',
  icon: 'Braces',
  tags: ['json', 'format', 'minify', 'beautify', 'validate', 'pretty'],
  seo: {
    title: 'JSON Formatter & Validator — blutils',
    description:
      'Local-only JSON formatter, minifier, and validator. Nothing leaves your browser.',
  },
  status: 'stable',
  aliases: [
    { slug: 'json-format' },
    { slug: 'json-minify', initialState: { mode: 'minify' } },
    { slug: 'json-validator' },
  ],
}
