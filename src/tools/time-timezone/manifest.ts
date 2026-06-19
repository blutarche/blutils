import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'time.timezone',
  category: 'time',
  slug: 'timezone',
  name: 'Timezone',
  title: 'time.timezone',
  description: 'convert across time zones',
  icon: 'Globe',
  tags: ['timezone', 'tz', 'utc', 'gmt', 'date', 'time', 'convert'],
  seo: {
    title: 'Timezone & Date Converter — blutils',
    description:
      'Convert a date and time across IANA time zones with UTC offsets and DST. Uses the built-in browser tz database. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [{ slug: 'tz' }],
}
