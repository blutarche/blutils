import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.jwt',
  category: 'inspect',
  slug: 'jwt',
  name: 'JWT Decoder',
  title: 'jwt.decode',
  description: 'decode header · payload · claims',
  icon: 'KeyRound',
  tags: ['jwt', 'jws', 'token', 'bearer', 'auth', 'claims', 'decode'],
  seo: {
    title: 'JWT Decoder — blutils',
    description:
      'Decode a JWT header, payload, and standard claims (exp/iat/nbf) in the browser. Signature is not verified. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
}
