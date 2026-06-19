/**
 * Tool catalog — glob-discovered.
 *
 * Every Tool lives in src/tools/<folder>/manifest.ts and exports
 * a `manifest` of shape ToolManifest. Vite's import.meta.glob
 * eagerly bundles all manifests into the shell at build time so
 * the Sidebar, Palette, router, and prerender can enumerate the
 * catalog without loading any Tool component.
 *
 * Tool components (Tool.tsx) are also globbed, but **lazily** —
 * each entry maps to a Suspense-aware component that loads its
 * chunk only when the route opens. The shell bundle stays
 * independent of the Tool count.
 *
 * Validation runs at module load. Any of the following breaks
 * the build:
 *   - duplicate Tool id
 *   - duplicate <category>/<slug> URL (including aliases)
 *   - unknown category
 *   - missing `manifest` export
 *   - missing matching Tool.tsx for a manifest's folder
 */

import { createElement } from 'preact'
import type { ComponentType } from 'preact'
import type {
  CategoryId,
  Detector,
  DetectorMatch,
  ToolManifest,
  ToolProps,
} from '../types'
import { categories, hasCategory } from '../categories'

interface ManifestModule {
  manifest: ToolManifest
}

interface ToolModule {
  default: ComponentType<ToolProps>
}

const manifestModules = import.meta.glob<ManifestModule>(
  './*/manifest.ts',
  { eager: true },
)

const componentModules = import.meta.glob<ToolModule>('./*/Tool.tsx')

interface DetectModule {
  detect: Detector
}

// Detectors are eager — they're tiny regex tests, run synchronously
// on every palette open. Keeping them in the shell bundle avoids
// an async fan-out across N lazy chunks for one clipboard read.
const detectModules = import.meta.glob<DetectModule>('./*/detect.ts', {
  eager: true,
})

function folderFromPath(path: string): string | null {
  const m = path.match(/^\.\/([^/]+)\/(?:manifest\.ts|Tool\.tsx)$/)
  return m ? m[1]! : null
}

interface RegisteredTool {
  manifest: ToolManifest
  folder: string
  /** Lazy Tool component. Suspense awaits its chunk on first render. */
  Component: ComponentType<ToolProps>
  /** Warm this tool's chunk into the component's own resolution state. */
  preload: () => void
  detect?: Detector
}

interface Preloadable {
  Component: ComponentType<ToolProps>
  preload: () => void
}

/**
 * A preact `lazy()` work-alike that also exposes `preload()` to warm
 * its chunk *into the same closure state the component renders from*.
 *
 * preact's built-in `lazy()` keeps its resolved module in a private
 * closure populated only on first render, so warming the chunk through
 * a separate loader call would fill the module cache yet still leave
 * the component suspending on mount. Sharing one record means a tool
 * that finished preloading (hover / focus) renders **synchronously** on
 * navigation — no Suspense fallback, no flash — while a cold mount
 * suspends on the very same promise.
 *
 * Mirrors preact lazy's error semantics: a failed load is latched and
 * re-thrown on render (no automatic retry).
 */
function preloadableLazy(loader: () => Promise<ToolModule>): Preloadable {
  let promise: Promise<void> | undefined
  let component: ComponentType<ToolProps> | undefined
  let error: unknown
  let resolved = false

  const start = (): Promise<void> => {
    if (!promise) {
      promise = loader().then(
        (mod) => {
          component = mod.default
          resolved = true
        },
        (e) => {
          error = e
          resolved = true
        },
      )
    }
    return promise
  }

  function Lazy(props: ToolProps) {
    if (error) throw error
    if (!resolved) throw start()
    return component ? createElement(component, props) : null
  }
  Lazy.displayName = 'Lazy'

  return { Component: Lazy as ComponentType<ToolProps>, preload: start }
}

function loadRegistry(): RegisteredTool[] {
  const out: RegisteredTool[] = []
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

    const folder = folderFromPath(path)
    if (!folder) {
      throw new Error(`Tool "${m.id}": cannot parse folder from ${path}`)
    }

    const componentPath = `./${folder}/Tool.tsx`
    const loader = componentModules[componentPath]
    if (!loader) {
      throw new Error(
        `Tool "${m.id}": missing component at ${componentPath}`,
      )
    }

    const detectModule = detectModules[`./${folder}/detect.ts`]
    const { Component, preload } = preloadableLazy(loader)
    out.push({
      manifest: m,
      folder,
      Component,
      preload,
      detect: detectModule?.detect,
    })
  }

  return out
}

const registry = loadRegistry()

/** Frozen flat list of every registered Tool manifest, in glob order. */
export const tools: readonly ToolManifest[] = Object.freeze(
  registry.map((r) => r.manifest),
)

/** Map from Tool id to manifest. */
export const toolById: ReadonlyMap<string, ToolManifest> = new Map(
  registry.map((r) => [r.manifest.id, r.manifest]),
)

/** Map from Tool id to its lazy component. Used by the router. */
export const componentById: ReadonlyMap<
  string,
  ComponentType<ToolProps>
> = new Map(registry.map((r) => [r.manifest.id, r.Component]))

const preloadById = new Map(registry.map((r) => [r.manifest.id, r.preload]))

/**
 * Warm a Tool's lazy chunk before navigation — wired to hover /
 * focus / touchstart on every Tool link. The warm fills the same
 * resolution state the lazy component renders from, so a Tool that
 * finished preloading mounts synchronously with no Suspense fallback.
 * Idempotent: the underlying dynamic import fires at most once.
 */
export function prefetchTool(id: string): void {
  preloadById.get(id)?.()
}

/**
 * Run every registered Detector and return the highest-confidence
 * non-null match, or null. The Tool whose Detector wins is named
 * by `toolId` so the Palette can route the open action.
 */
export interface DetectionResult {
  toolId: string
  match: DetectorMatch
}

export function detectFromText(text: string): DetectionResult | null {
  let best: DetectionResult | null = null
  for (const r of registry) {
    if (!r.detect) continue
    const m = r.detect(text)
    if (!m) continue
    if (!best || m.confidence > best.match.confidence) {
      best = { toolId: r.manifest.id, match: m }
    }
  }
  return best
}

export interface CategorySection {
  category: CategoryId
  /** Display name (lowercase per design). */
  name: string
  tools: ToolManifest[]
}

/**
 * Tools grouped by Category, in the curated Category display
 * order from src/categories.ts. Within each Category, Tools sort
 * alphabetically by name with `experimental` Tools sunk to the
 * bottom. Categories with zero Tools are omitted.
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
