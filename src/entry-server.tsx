/**
 * SSR / prerender entry.
 *
 * Built via `vite build --ssr` into a Node-loadable bundle that
 * scripts/prerender.mjs imports. For each route from
 * allRoutePaths() the script calls `render(pathname)`, gets the
 * markup + per-route meta, and writes a static HTML file.
 *
 * renderToStringAsync handles the lazy Tool components — the
 * prerender awaits each Tool's chunk so the resulting HTML
 * contains the fully-rendered shell + Tool head.
 */

import { renderToStringAsync } from 'preact-render-to-string'
import { App } from './app/App'
import { matchRoute, allRoutePaths } from './router/match'

export interface RouteHead {
  title: string
  description: string
  ogType: string
  canonical: string
}

const HOST = 'https://utils.blutarche.dev'

const DEFAULT_DESCRIPTION =
  'Local-only, in-browser developer utilities. Nothing leaves your browser.'

function headFor(pathname: string): RouteHead {
  const m = matchRoute(pathname)
  let title = 'blutils — local-only developer utilities'
  let description = DEFAULT_DESCRIPTION
  switch (m.type) {
    case 'tool':
      title = m.manifest.seo.title
      description = m.manifest.seo.description
      break
    case 'chain':
      title = 'chain — blutils'
      description = 'Compose primitive operations into a chain. Local-only.'
      break
    case 'not-found':
      title = 'not found — blutils'
      description = 'This route does not exist.'
      break
  }
  return {
    title,
    description,
    ogType: 'website',
    canonical: `${HOST}${pathname}`,
  }
}

export async function render(pathname: string): Promise<{
  html: string
  head: RouteHead
}> {
  const html = await renderToStringAsync(<App initialPath={pathname} />)
  return { html, head: headFor(pathname) }
}

export { allRoutePaths }
