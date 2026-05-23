import type { ToolManifest } from '../../types'

export const manifest: ToolManifest = {
  id: 'generate.qr',
  category: 'generate',
  slug: 'qr',
  name: 'QR Code',
  title: 'qr.encode',
  description: 'text or URL → QR · SVG',
  icon: 'QrCode',
  tags: ['qr', 'qrcode', 'encode', 'barcode'],
  seo: {
    title: 'QR Code Generator — blutils',
    description:
      'Encode any text or URL as a QR code, rendered as inline SVG. Local-only.',
  },
  status: 'stable',
  aliases: [{ slug: 'qrcode' }],
}
