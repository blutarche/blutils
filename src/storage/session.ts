/**
 * sessionStorage helpers for Bucket B — per-Tool inputs.
 *
 * sessionStorage is the always-on home for Tool input strings, the
 * Chain input, and any other "this tab, this session" state. The
 * 256 KB per-entry cap is enforced here so a runaway paste doesn't
 * blow the per-origin storage quota (typically ~5 MB shared with
 * Bucket A localStorage).
 *
 * SSR-safe: every call guards on `typeof window` so the module is
 * import-safe during prerender. Failures (quota, private mode,
 * disabled storage) are swallowed — losing an input write should
 * never crash a Tool.
 */

import { STORAGE_NAMESPACE } from './schema'

/** Per-entry cap. 256 KB chosen as a generous ceiling for any
 *  reasonable Tool input (largest payload in scope is Markdown
 *  source, which the prototype tops out under 100 KB). */
const MAX_BYTES = 256 * 1024

const hasSession =
  typeof window !== 'undefined' && 'sessionStorage' in window

export function readSession(key: string): string | null {
  if (!hasSession) return null
  try {
    return sessionStorage.getItem(STORAGE_NAMESPACE + key)
  } catch {
    return null
  }
}

/** Returns false when the value exceeds the per-entry cap or the
 *  storage write throws (quota / private mode / disabled). */
export function writeSession(key: string, value: string): boolean {
  if (!hasSession) return false
  if (value.length > MAX_BYTES) return false
  try {
    sessionStorage.setItem(STORAGE_NAMESPACE + key, value)
    return true
  } catch {
    return false
  }
}

export function removeSession(key: string): void {
  if (!hasSession) return
  try {
    sessionStorage.removeItem(STORAGE_NAMESPACE + key)
  } catch {
    // ignore
  }
}

/** Wipes every key under the blutils namespace from sessionStorage.
 *  Pairs with clearAllLocal() for the `Clear all data` Command. */
export function clearAllSession(): void {
  if (!hasSession) return
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(STORAGE_NAMESPACE)) keys.push(k)
    }
    for (const k of keys) sessionStorage.removeItem(k)
  } catch {
    // ignore
  }
}
