import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.chmod',
  category: 'inspect',
  slug: 'chmod',
  name: 'Chmod Calculator',
  title: 'unix.chmod',
  description: 'octal ↔ rwx permissions',
  icon: 'Calculator',
  tags: ['chmod', 'permissions', 'unix', 'octal', 'rwx', 'file', 'mode'],
  seo: {
    title: 'Chmod Calculator — blutils',
    description:
      'Convert between octal file modes and rwx symbolic permissions, or toggle the owner/group/other bits directly. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
