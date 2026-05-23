import { defineConfig, type Plugin } from 'vite'
import preact from '@preact/preset-vite'
import pkg from './package.json' with { type: 'json' }
import { buildCspHeader } from './src/app/csp'

/**
 * Injects the production CSP as a <meta> tag during `vite build`.
 *
 * Skipped during `vite serve` (dev) because the strict
 * connect-src 'none' would break Vite's HMR WebSocket. The real
 * CSP in production is also served as an HTTP header
 * (Cloudflare Pages _headers) at Phase 12; the meta tag is
 * defence in depth.
 */
function cspMetaPlugin(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const csp = buildCspHeader()
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      )
    },
  }
}

export default defineConfig({
  plugins: [preact(), cspMetaPlugin()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
  },
})
