import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'generate.password',
  category: 'generate',
  slug: 'password',
  name: 'Password',
  title: 'generate.password',
  description: 'password · passphrase · entropy',
  icon: 'Lock',
  tags: ['password', 'passphrase', 'diceware', 'secret', 'strong', 'entropy'],
  seo: {
    title: 'Password & Passphrase Generator — blutils',
    description:
      'Generate strong passwords and diceware-style passphrases with the browser CSPRNG. Entropy estimate included. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
