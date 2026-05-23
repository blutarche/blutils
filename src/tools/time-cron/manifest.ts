import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'time.cron',
  category: 'time',
  slug: 'cron',
  name: 'Cron Parser',
  title: 'cron.parse',
  description: '5-field cron + next runs',
  icon: 'TimerReset',
  tags: ['cron', 'crontab', 'schedule', 'time'],
  seo: {
    title: 'Cron Expression Parser — blutils',
    description:
      'Parse 5-field cron expressions, explain them in English, and preview the next runs. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'crontab' }],
}
