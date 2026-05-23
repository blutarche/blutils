/**
 * Pathname → route resolution.
 *
 * The route table is precomputed at module load from the eager
 * Tool registry: one entry per Tool URL and one per declared
 * alias (with the alias's `initialState` preserved on the match).
 * Plus the two reserved routes — `/` (home) and `/chain` (Chain
 * Mode, lands in Phase 9).
 *
 * Map lookup is O(1); pathname normalisation trims a single
 * trailing slash so `/format/json/` matches `/format/json`.
 */

import type { ToolManifest } from '../types'
import { tools } from '../tools/_registry'

export type RouteMatch =
  | { type: 'home' }
  | { type: 'chain' }
  | {
      type: 'tool'
      manifest: ToolManifest
      initialState?: Record<string, unknown>
    }
  | { type: 'not-found' }

const routes = new Map<string, RouteMatch>()

routes.set('/', { type: 'home' })
routes.set('/chain', { type: 'chain' })

for (const m of tools) {
  routes.set(`/${m.category}/${m.slug}`, { type: 'tool', manifest: m })
  for (const a of m.aliases ?? []) {
    routes.set(`/${m.category}/${a.slug}`, {
      type: 'tool',
      manifest: m,
      initialState: a.initialState,
    })
  }
}

function normalise(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function matchRoute(pathname: string): RouteMatch {
  return routes.get(normalise(pathname)) ?? { type: 'not-found' }
}

/** All registered pathnames — used by the prerender pipeline. */
export function allRoutePaths(): string[] {
  return Array.from(routes.keys())
}
