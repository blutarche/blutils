import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.jsondiff',
  category: 'inspect',
  slug: 'json-diff',
  name: 'JSON Diff',
  title: 'json.diff',
  description: 'semantic diff · by path',
  icon: 'GitMerge',
  tags: ['json', 'diff', 'compare', 'structural', 'changes'],
  seo: {
    title: 'JSON Diff — blutils',
    description:
      'Structural, semantic diff between two JSON documents, reported by path. Key order ignored. Local-only — nothing leaves your browser.',
  },
  status: 'stable',
}
