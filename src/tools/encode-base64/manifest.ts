import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.base64',
  category: 'encode',
  slug: 'base64',
  name: 'Base64',
  title: 'base64.encode',
  description: 'encode / decode · url-safe',
  icon: 'Binary',
  tags: ['base64', 'b64', 'encode', 'decode', 'url-safe'],
  seo: {
    title: 'Base64 Encoder & Decoder — blutils',
    description:
      'Encode and decode Base64 in the browser. URL-safe variant and round-trip verification. Local-only.',
  },
  status: 'stable',
  aliases: [
    { slug: 'b64' },
    { slug: 'base64-encode', initialState: { mode: 'encode' } },
    { slug: 'base64-decode', initialState: { mode: 'decode' } },
  ],
}
