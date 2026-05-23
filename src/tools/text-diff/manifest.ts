import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'text.diff',
  category: 'text',
  slug: 'diff',
  name: 'Text Diff',
  title: 'text.diff',
  description: 'line-by-line · LCS',
  icon: 'ArrowLeftRight',
  tags: ['diff', 'compare', 'lcs', 'difference', 'text'],
  seo: {
    title: 'Text Diff — blutils',
    description:
      'Line-by-line side-by-side text diff via LCS. Local-only, no upload.',
  },
  status: 'stable',
  aliases: [{ slug: 'compare' }],
}
