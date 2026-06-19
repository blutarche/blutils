import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.unicode',
  category: 'inspect',
  slug: 'unicode',
  name: 'Unicode Inspector',
  title: 'unicode.inspect',
  description: 'code points · escapes · UTF-8',
  icon: 'Type',
  tags: [
    'unicode',
    'codepoint',
    'utf-8',
    'escape',
    'character',
    'glyph',
  ],
  seo: {
    title: 'Unicode Inspector — blutils',
    description:
      'Break text into Unicode code points with hex, JS and ES escapes, HTML entities, and UTF-8 bytes. Code-point and UTF-16 code-unit counts. Local-only.',
  },
  status: 'stable',
}
