/**
 * Storage slice contract.
 *
 * Each persisted slice has its own key, version, default, and a
 * runtime parser. Slice versions are independent of the app
 * semver: most app bumps touch no slice. A slice version is
 * bumped (e.g. "tweaks:v1" → "tweaks:v2") only when the shape
 * changes and old data needs a migration (or, for the simplest
 * case, gets dropped back to defaults).
 *
 * Read returns the slice's defaults when the stored value is
 * absent, malformed, or fails the parser. Old slice versions are
 * effectively dropped — they live under a different key and the
 * new version reads from a fresh key.
 *
 * Bucket A (always persisted) slices live here. Bucket B
 * (sessionStorage Tool inputs) and Bucket C (the opt-in
 * localStorage mirror gated by `rememberInputs`) arrive in later
 * phases as their consumers land.
 */

import type { Tweaks } from '../types'

const NS = 'blutils'

export interface Slice<T> {
  key: string
  defaults: T
  parse: (raw: unknown) => T | null
}

export const tweaksSlice: Slice<Tweaks> = {
  key: `${NS}:tweaks:v1`,
  defaults: {
    theme: 'dark',
    density: 'regular',
    showAdvanced: false,
    smartHints: true,
    rememberInputs: false,
  },
  parse(raw) {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    if (
      (r.theme === 'dark' || r.theme === 'light') &&
      (r.density === 'compact' || r.density === 'regular') &&
      typeof r.showAdvanced === 'boolean' &&
      typeof r.smartHints === 'boolean' &&
      typeof r.rememberInputs === 'boolean'
    ) {
      return {
        theme: r.theme,
        density: r.density,
        showAdvanced: r.showAdvanced,
        smartHints: r.smartHints,
        rememberInputs: r.rememberInputs,
      }
    }
    return null
  },
}

/** Namespace prefix for the `Clear all data` Command to wipe. */
export const STORAGE_NAMESPACE = `${NS}:`

export interface TabRecord {
  /** Stable id, generated when the tab opens. */
  id: string
  /** Pathname the tab is currently showing. */
  path: string
}

export interface TabsSliceShape {
  /** Multi-Tab Mode toggle. When false, the rest is dormant. */
  enabled: boolean
  /** Open tabs in display order. */
  tabs: TabRecord[]
  /** Id of the active tab. null when tabs is empty. */
  activeId: string | null
}

export const tabsSlice: Slice<TabsSliceShape> = {
  key: `${NS}:tabs:v1`,
  defaults: {
    enabled: false,
    tabs: [],
    activeId: null,
  },
  parse(raw) {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    if (typeof r.enabled !== 'boolean') return null
    if (!Array.isArray(r.tabs)) return null
    const tabs: TabRecord[] = []
    for (const t of r.tabs) {
      if (!t || typeof t !== 'object') return null
      const rec = t as Record<string, unknown>
      if (typeof rec.id !== 'string' || typeof rec.path !== 'string') return null
      tabs.push({ id: rec.id, path: rec.path })
    }
    const activeId =
      r.activeId === null
        ? null
        : typeof r.activeId === 'string'
          ? r.activeId
          : null
    return { enabled: r.enabled, tabs, activeId }
  },
}

export interface ChainStepRecord {
  /** Stable id, generated when the step is added. */
  id: string
  /** Op id from the ops registry, or the literal "input" sentinel. */
  opId: string
}

export interface ChainSliceShape {
  steps: ChainStepRecord[]
}

/**
 * Chain layout persists to localStorage. The `input` step's text
 * lives in sessionStorage (bucket B) like every other Tool input,
 * so the chain shape and the chain payload follow the same
 * privacy rules as the rest of the catalog.
 */
export const chainSlice: Slice<ChainSliceShape> = {
  key: `${NS}:chain:v1`,
  defaults: {
    steps: [
      { id: 'input', opId: 'input' },
      { id: 'b64', opId: 'b64.encode' },
      { id: 'sha', opId: 'hash.sha256' },
    ],
  },
  parse(raw) {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    if (!Array.isArray(r.steps)) return null
    const steps: ChainStepRecord[] = []
    for (const s of r.steps) {
      if (!s || typeof s !== 'object') return null
      const rec = s as Record<string, unknown>
      if (typeof rec.id !== 'string' || typeof rec.opId !== 'string') return null
      steps.push({ id: rec.id, opId: rec.opId })
    }
    const first = steps[0]
    if (!first || first.opId !== 'input') return null
    return { steps }
  },
}
