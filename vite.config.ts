import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [preact()],
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
