/**
 * Curated Category set.
 *
 * The CategoryId union in src/types.ts is the closed set; this
 * file is the single source for display name and curated order.
 * Sidebar sections and the Home grid both render in the order
 * listed here.
 *
 * Adding a Category: edit CategoryId in types.ts and add an entry
 * here. Removing one: same in reverse. Either is a deliberate
 * change that should ship in its own commit.
 */

import type { Category, CategoryId } from './types'

export const categories: readonly Category[] = [
  { id: 'format',   name: 'format',   order: 0 },
  { id: 'encode',   name: 'encode',   order: 1 },
  { id: 'hash',     name: 'hash',     order: 2 },
  { id: 'text',     name: 'text',     order: 3 },
  { id: 'time',     name: 'time',     order: 4 },
  { id: 'generate', name: 'generate', order: 5 },
  { id: 'inspect',  name: 'inspect',  order: 6 },
] as const

const byId = new Map<CategoryId, Category>(categories.map((c) => [c.id, c]))

export function getCategory(id: CategoryId): Category {
  const c = byId.get(id)
  if (!c) throw new Error(`Unknown category: ${id}`)
  return c
}

export function hasCategory(id: string): id is CategoryId {
  return byId.has(id as CategoryId)
}
