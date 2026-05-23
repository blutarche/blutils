import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'time.unix',
  category: 'time',
  slug: 'unix',
  name: 'Unix Time',
  title: 'unix.time',
  description: 'epoch ↔ date · live',
  icon: 'Clock',
  tags: ['unix', 'epoch', 'timestamp', 'time', 'date', 'iso'],
  seo: {
    title: 'Unix Timestamp Converter — blutils',
    description:
      'Convert between Unix timestamps and human-readable dates. Live clock, ISO 8601, RFC 2822, relative time. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'epoch' }, { slug: 'timestamp' }],
}
