/**
 * Tool catalog — glob-discovered.
 *
 * Every Tool lives in src/tools/<folder>/manifest.ts and exports
 * a `manifest` of shape ToolManifest. Vite's import.meta.glob
 * eagerly bundles all manifests into the shell at build time so
 * the Sidebar, Palette, router, and prerender can enumerate the
 * catalog without loading any Tool component.
 *
 * Tool components (Tool.tsx) are deliberately not loaded here —
 * the router (Phase 3) glob-loads them lazily.
 *
 * Validation runs at module load. Any of the following breaks
 * the build:
 *   - duplicate Tool id
 *   - duplicate <category>/<slug> URL (including aliases)
 *   - unknown category
 *   - missing `manifest` export
 *
 * The error throws happen at import time, so a malformed Tool
 * fails the build with a clear message instead of silently
 * shadowing another Tool.
 */

import type { CategoryId, ToolManifest } from '../types'
import { categories, hasCategory } from '../categories'

interface ManifestModule {
  manifest: ToolManifest
}

const manifestModules = import.meta.glob<ManifestModule>(
  './*/manifest.ts',
  { eager: true },
)

function loadManifests(): ToolManifest[] {
  const list: ToolManifest[] = []
  const idSet = new Set<string>()
  const urlSet = new Set<string>()

  for (const [path, mod] of Object.entries(manifestModules)) {
    const m = mod.manifest
    if (!m) {
      throw new Error(`Tool ${path}: missing manifest export`)
    }

    if (idSet.has(m.id)) {
      throw new Error(`Duplicate Tool id: "${m.id}" (from ${path})`)
    }
    idSet.add(m.id)

    if (!hasCategory(m.category)) {
      throw new Error(
        `Tool "${m.id}": unknown category "${m.category}" — add it to CategoryId and src/categories.ts`,
      )
    }

    const url = `/${m.category}/${m.slug}`
    if (urlSet.has(url)) {
      throw new Error(`Duplicate Tool URL: ${url} (from ${m.id})`)
    }
    urlSet.add(url)

    for (const a of m.aliases ?? []) {
      const aurl = `/${m.category}/${a.slug}`
      if (urlSet.has(aurl)) {
        throw new Error(`Duplicate alias URL: ${aurl} (from ${m.id})`)
      }
      urlSet.add(aurl)
    }

    list.push(m)
  }

  return list
}

/** Frozen flat list of every registered Tool, in glob order. */
export const tools: readonly ToolManifest[] = Object.freeze(loadManifests())

/** Map from Tool id to manifest. */
export const toolById = new Map<string, ToolManifest>(
  tools.map((m) => [m.id, m]),
)

export interface CategorySection {
  category: CategoryId
  /** Display name (lowercase per design). */
  name: string
  tools: ToolManifest[]
}

/**
 * Tools grouped by their Category, in the curated Category
 * display order from src/categories.ts. Within each Category,
 * Tools sort alphabetically by name with `experimental` Tools
 * sunk to the bottom.
 *
 * Categories with zero Tools are omitted.
 */
export function toolsByCategory(): CategorySection[] {
  const grouped = new Map<CategoryId, ToolManifest[]>()
  for (const m of tools) {
    let bucket = grouped.get(m.category)
    if (!bucket) {
      bucket = []
      grouped.set(m.category, bucket)
    }
    bucket.push(m)
  }

  const sections: CategorySection[] = []
  for (const cat of categories) {
    const bucket = grouped.get(cat.id)
    if (!bucket || bucket.length === 0) continue
    bucket.sort((a, b) => {
      const aExp = a.status === 'experimental' ? 1 : 0
      const bExp = b.status === 'experimental' ? 1 : 0
      if (aExp !== bExp) return aExp - bExp
      return a.name.localeCompare(b.name)
    })
    sections.push({ category: cat.id, name: cat.name, tools: bucket })
  }
  return sections
}
