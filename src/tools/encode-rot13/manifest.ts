import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.rot13',
  category: 'encode',
  slug: 'rot13',
  name: 'ROT13 / Caesar',
  title: 'rot13.caesar',
  description: 'letter-rotation cipher',
  icon: 'RotateCw',
  tags: ['rot13', 'caesar', 'cipher', 'shift', 'rotate', 'encode'],
  seo: {
    title: 'ROT13 & Caesar Cipher — blutils',
    description:
      'Apply ROT13 or a Caesar shift to text in the browser. Rotates A-Z / a-z, preserves case, leaves everything else untouched. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'caesar' }],
}
