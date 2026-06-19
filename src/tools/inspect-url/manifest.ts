import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.url',
  category: 'inspect',
  slug: 'url',
  name: 'URL Parser',
  title: 'url.parse',
  description: 'protocol · host · path · query',
  icon: 'Unlink',
  tags: ['url', 'uri', 'parse', 'query', 'params', 'components'],
  seo: {
    title: 'URL Parser — blutils',
    description:
      'Break a URL into its components — protocol, host, port, path, query params, and hash — in the browser. Duplicate query keys preserved. Local-only.',
  },
  status: 'stable',
}
