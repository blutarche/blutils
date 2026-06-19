import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.hex',
  category: 'encode',
  slug: 'hex',
  name: 'Hex Viewer',
  title: 'hex.dump',
  description: 'text ↔ hex · hexdump',
  icon: 'FileDigit',
  tags: ['hex', 'hexadecimal', 'hexdump', 'bytes', 'encode', 'decode', 'dump'],
  seo: {
    title: 'Hex Viewer & Hexdump — blutils',
    description:
      'Convert text to and from hexadecimal and view a classic hexdump in the browser. UTF-8, uppercase, and delimiter options. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'hexdump' }],
}
