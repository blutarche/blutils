import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'text.case',
  category: 'text',
  slug: 'case',
  name: 'Case Converter',
  title: 'text.case',
  description: 'camel · snake · kebab · …',
  icon: 'CaseSensitive',
  tags: [
    'case',
    'camel',
    'snake',
    'kebab',
    'pascal',
    'constant',
    'title',
    'upper',
    'lower',
  ],
  seo: {
    title: 'Case Converter — blutils',
    description:
      'Convert text between camelCase, snake_case, kebab-case, PascalCase, CONSTANT_CASE, Title Case and more. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
