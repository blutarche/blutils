import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'format.markdown',
  category: 'format',
  slug: 'markdown',
  name: 'Markdown',
  title: 'markdown.preview',
  description: 'commonmark · live preview',
  icon: 'FileText',
  tags: ['markdown', 'md', 'commonmark', 'preview'],
  seo: {
    title: 'Markdown Preview — blutils',
    description:
      'Live CommonMark preview, sanitised in the browser. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'md' }],
}
