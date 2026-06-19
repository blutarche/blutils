import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.http',
  category: 'inspect',
  slug: 'http-status',
  name: 'HTTP Status',
  title: 'http.status',
  description: 'status codes · meanings',
  icon: 'Server',
  tags: ['http', 'status', 'code', 'rest', 'api', 'response'],
  seo: {
    title: 'HTTP Status Codes — blutils',
    description:
      'Reference for HTTP status codes 1xx–5xx with reason phrases and plain-language meanings. Search by code or text. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'status-codes' }],
}
