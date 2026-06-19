import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.jws',
  category: 'encode',
  slug: 'jwt-sign',
  name: 'JWT Signer',
  title: 'jwt.sign',
  description: 'sign HS256/384/512 · local',
  icon: 'KeyRound',
  tags: ['jwt', 'jws', 'sign', 'hmac', 'token', 'hs256'],
  seo: {
    title: 'JWT Signer — blutils',
    description:
      'Sign a JWT with HMAC (HS256/HS384/HS512) in the browser. The secret stays local — nothing is sent anywhere.',
  },
  status: 'stable',
}
