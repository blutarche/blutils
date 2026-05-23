import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'generate.lorem',
  category: 'generate',
  slug: 'lorem',
  name: 'Lorem Ipsum',
  title: 'lorem.ipsum',
  description: 'filler text generator',
  icon: 'Type',
  tags: ['lorem', 'ipsum', 'lipsum', 'placeholder', 'filler', 'dummy'],
  seo: {
    title: 'Lorem Ipsum Generator — blutils',
    description:
      'Generate placeholder words, sentences, or paragraphs of lorem ipsum. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'lipsum' }, { slug: 'placeholder' }],
}
