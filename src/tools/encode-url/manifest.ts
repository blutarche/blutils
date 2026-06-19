import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.url',
  category: 'encode',
  slug: 'url',
  name: 'URL Encode',
  title: 'url.encode',
  description: 'encode / decode · component',
  icon: 'Link',
  tags: ['url', 'uri', 'encode', 'decode', 'percent', 'escape'],
  seo: {
    title: 'URL Encoder & Decoder — blutils',
    description:
      'Percent-encode and decode URLs in the browser. Component and full-URI variants with round-trip verification. Local-only.',
  },
  status: 'stable',
  aliases: [
    { slug: 'url-encode', initialState: { mode: 'encode' } },
    { slug: 'url-decode', initialState: { mode: 'decode' } },
  ],
}
