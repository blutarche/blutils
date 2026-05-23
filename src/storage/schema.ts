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
