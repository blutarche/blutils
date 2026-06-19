import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'format.types',
  category: 'format',
  slug: 'json-to-types',
  name: 'JSON to Types',
  title: 'json.to.types',
  description: 'infer TypeScript interfaces',
  icon: 'FileCode',
  tags: ['json', 'typescript', 'types', 'interface', 'codegen', 'schema'],
  seo: {
    title: 'JSON to TypeScript Types — blutils',
    description:
      'Infer TypeScript interfaces from a JSON sample. Nested objects, optional keys, and unions — all worked out in your browser. Nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [{ slug: 'json-to-ts' }],
}
