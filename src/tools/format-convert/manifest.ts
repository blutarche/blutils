import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'format.convert',
  category: 'format',
  slug: 'convert',
  name: 'Format Converter',
  title: 'format.convert',
  description: 'JSON · YAML · TOML · CSV',
  icon: 'ArrowLeftRight',
  tags: ['convert', 'json', 'yaml', 'toml', 'csv', 'transform', 'format'],
  seo: {
    title: 'Data Format Converter — blutils',
    description:
      'Local-only converter between JSON, YAML, TOML, and CSV. Nothing leaves your browser.',
  },
  status: 'stable',
  aliases: [
    { slug: 'json-to-yaml', initialState: { from: 'json', to: 'yaml' } },
    { slug: 'yaml-to-json', initialState: { from: 'yaml', to: 'json' } },
  ],
}
