import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.html',
  category: 'encode',
  slug: 'html-entities',
  name: 'HTML Entities',
  title: 'html.entities',
  description: 'encode / decode · named + numeric',
  icon: 'Code',
  tags: [
    'html',
    'entities',
    'escape',
    'unescape',
    'encode',
    'decode',
    'ampersand',
  ],
  seo: {
    title: 'HTML Entities Encoder & Decoder — blutils',
    description:
      'Escape and unescape HTML entities in the browser — named and numeric (decimal and hex). Optional non-ASCII to numeric. Local-only.',
  },
  status: 'stable',
  aliases: [
    { slug: 'html-encode', initialState: { mode: 'encode' } },
    { slug: 'html-decode', initialState: { mode: 'decode' } },
  ],
}
