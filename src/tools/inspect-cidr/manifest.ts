import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'inspect.cidr',
  category: 'inspect',
  slug: 'cidr',
  name: 'Subnet Calculator',
  title: 'ip.cidr',
  description: 'IPv4 CIDR · ranges · masks',
  icon: 'Network',
  tags: ['ip', 'ipv4', 'cidr', 'subnet', 'netmask', 'network', 'broadcast'],
  seo: {
    title: 'IPv4 Subnet Calculator — blutils',
    description:
      'Compute network, broadcast, netmask, wildcard, host range, and counts for an IPv4 CIDR block. Local-only — nothing is sent anywhere.',
  },
  status: 'stable',
  aliases: [{ slug: 'subnet' }],
}
