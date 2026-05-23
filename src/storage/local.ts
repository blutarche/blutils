/**
 * localStorage helpers for Bucket A (always-persisted) slices.
 *
 * Reads are total: when a key is missing, malformed, or fails the
 * slice's parser, the slice's defaults come back. Writes are
 * fire-and-forget — storage exceptions (quota, private browsing,
 * disabled storage) are swallowed because losing a Tweak write
 * should never crash the app.
 *
 * SSR-safety: every entry point guards on `typeof window` so the
 * module is import-safe during the prerender build step.
 */

import { STORAGE_NAMESPACE, type Slice } from './schema'

const hasStorage = typeof window !== 'undefined' && 'localStorage' in window

export function readSlice<T>(slice: Slice<T>): T {
  if (!hasStorage) return slice.defaults
  try {
    const raw = localStorage.getItem(slice.key)
    if (raw == null) return slice.defaults
    const parsed = slice.parse(JSON.parse(raw))
    return parsed ?? slice.defaults
  } catch {
    return slice.defaults
  }
}

export function writeSlice<T>(slice: Slice<T>, value: T): void {
  if (!hasStorage) return
  try {
    localStorage.setItem(slice.key, JSON.stringify(value))
  } catch {
    // ignore (quota, private mode, disabled storage)
  }
}

/**
 * Wipes every key under the blutils namespace from localStorage.
 * Backs the `Clear all data` Command once the Palette lands.
 */
export function clearAllLocal(): void {
  if (!hasStorage) return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(STORAGE_NAMESPACE)) keys.push(k)
    }
    for (const k of keys) localStorage.removeItem(k)
  } catch {
    // ignore
  }
}
