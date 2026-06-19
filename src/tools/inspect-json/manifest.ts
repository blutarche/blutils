import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.json',
  category: 'inspect',
  slug: 'json-tree',
  name: 'JSON Tree',
  title: 'json.tree',
  description: 'collapsible tree · path copy',
  icon: 'ListTree',
  tags: ['json', 'tree', 'viewer', 'explore', 'path', 'inspect'],
  seo: {
    title: 'JSON Tree Viewer — blutils',
    description:
      'Explore JSON as a collapsible tree and copy any value’s JSONPath. Local-only — nothing leaves your browser.',
  },
  status: 'stable',
  aliases: [{ slug: 'json-viewer' }],
}
