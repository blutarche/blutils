import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.regex',
  category: 'inspect',
  slug: 'regex',
  name: 'Regex Tester',
  title: 'regex.test',
  description: 'JavaScript flavour · live highlight',
  icon: 'Regex',
  tags: ['regex', 'regexp', 'pattern', 'match', 'expression'],
  seo: {
    title: 'Regex Tester — blutils',
    description:
      'JavaScript-flavour regex tester. Live highlight, named groups, flag matrix. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'regexp' }, { slug: 'regex-tester' }],
}
