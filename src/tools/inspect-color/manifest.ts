import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.color',
  category: 'inspect',
  slug: 'color',
  name: 'Color Converter',
  title: 'color.convert',
  description: 'hex ↔ rgb ↔ hsl',
  icon: 'Palette',
  tags: ['color', 'colour', 'hex', 'rgb', 'hsl', 'convert', 'css'],
  seo: {
    title: 'Color Converter — blutils',
    description:
      'Convert colors between hex, rgb, and hsl in the browser. Live swatch preview and copyable outputs. Local-only.',
  },
  status: 'stable',
}
