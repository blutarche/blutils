import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'encode.base',
  category: 'encode',
  slug: 'base',
  name: 'Base Converter',
  title: 'base.convert',
  description: 'bin · oct · dec · hex · any 2-36',
  icon: 'Binary',
  tags: [
    'base',
    'radix',
    'binary',
    'octal',
    'hex',
    'hexadecimal',
    'decimal',
    'convert',
  ],
  seo: {
    title: 'Integer Base Converter — blutils',
    description:
      'Convert integers between binary, octal, decimal, hexadecimal, and any base 2-36. Arbitrary precision via BigInt. Local-only.',
  },
  status: 'stable',
}
