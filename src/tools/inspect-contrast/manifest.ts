import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.contrast',
  category: 'inspect',
  slug: 'contrast',
  name: 'Contrast Checker',
  title: 'color.contrast',
  description: 'WCAG ratio · AA / AAA',
  icon: 'Contrast',
  tags: ['contrast', 'wcag', 'accessibility', 'a11y', 'color', 'ratio'],
  seo: {
    title: 'WCAG Contrast Checker — blutils',
    description:
      'Check the WCAG 2.x contrast ratio between two colors and see AA / AAA pass-fail for normal and large text. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
