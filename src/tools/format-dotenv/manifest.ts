import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'format.dotenv',
  category: 'format',
  slug: 'env',
  name: 'Dotenv / JSON',
  title: 'env.json',
  description: '.env ↔ JSON',
  icon: 'FileText',
  tags: ['env', 'dotenv', 'environment', 'json', 'config'],
  seo: {
    title: 'Dotenv ↔ JSON Converter — blutils',
    description:
      'Convert .env files to JSON and back in the browser. Handles quotes, comments, and export prefixes. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [
    { slug: 'env-to-json', initialState: { mode: 'toJson' } },
    { slug: 'json-to-env', initialState: { mode: 'toEnv' } },
  ],
}
