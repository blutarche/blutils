/**
 * Optional localStorage mirror for Tool inputs (Bucket C).
 *
 * By default Tool inputs live in sessionStorage and vanish when the
 * tab closes — the privacy-respecting default. When the user opts
 * into the `rememberInputs` Tweak, every write is also mirrored to
 * localStorage under `blutils:inputs:v1`, and the mirror seeds
 * sessionStorage on the next cold load so inputs survive a tab close.
 *
 * Toggle semantics:
 *   - off → on : copy every existing sessionStorage Tool input into
 *                the mirror (so already-typed inputs survive the
 *                next reload, not just future inputs).
 *   - on → off : drop the mirror immediately. sessionStorage stays
 *                untouched; the current tab keeps its inputs.
 *
 * The mirror is a single JSON object keyed by Tool id rather than
 * one localStorage entry per Tool. Cuts down on key churn and lets
 * the entire mirror be wiped in one removeItem call.
 */

import { STORAGE_NAMESPACE } from './schema'
import { readSession, writeSession } from './session'

/** localStorage slot for the mirror. */
const MIRROR_KEY = `${STORAGE_NAMESPACE}inputs:v1`

/** sessionStorage key prefix (after STORAGE_NAMESPACE) for a Tool input. */
const INPUT_PREFIX = 'input:'

export function inputSessionKey(toolId: string): string {
  return INPUT_PREFIX + toolId
}

const hasLocal = typeof window !== 'undefined' && 'localStorage' in window
const hasSession = typeof window !== 'undefined' && 'sessionStorage' in window

function readMirror(): Record<string, string> {
  if (!hasLocal) return {}
  try {
    const raw = localStorage.getItem(MIRROR_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function writeMirror(map: Record<string, string>): void {
  if (!hasLocal) return
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(map))
  } catch {
    // ignore (quota, private mode)
  }
}

export function mirrorInputWrite(toolId: string, value: string): void {
  if (!hasLocal) return
  const cur = readMirror()
  cur[toolId] = value
  writeMirror(cur)
}

export function clearInputsMirror(): void {
  if (!hasLocal) return
  try {
    localStorage.removeItem(MIRROR_KEY)
  } catch {
    // ignore
  }
}

/** Cold-load hydration: copy mirrored inputs into sessionStorage so
 *  the first read by `useToolInput` finds them. Only fills entries
 *  that are absent from sessionStorage — never overwrites an entry
 *  the current tab has already touched. Idempotent within a load. */
let hydrated = false
export function hydrateSessionFromMirror(): void {
  if (hydrated) return
  hydrated = true
  if (!hasSession || !hasLocal) return
  const mirror = readMirror()
  for (const [toolId, value] of Object.entries(mirror)) {
    const sessionKey = inputSessionKey(toolId)
    if (readSession(sessionKey) == null) {
      writeSession(sessionKey, value)
    }
  }
}

/** Snapshot every Tool input currently in sessionStorage into the
 *  mirror. Called when `rememberInputs` flips off → on, so inputs
 *  already typed in this tab survive the next reload. */
export function snapshotSessionToMirror(): void {
  if (!hasLocal || !hasSession) return
  const map: Record<string, string> = readMirror()
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const fullKey = sessionStorage.key(i)
      if (!fullKey || !fullKey.startsWith(STORAGE_NAMESPACE)) continue
      const inner = fullKey.slice(STORAGE_NAMESPACE.length)
      if (!inner.startsWith(INPUT_PREFIX)) continue
      const toolId = inner.slice(INPUT_PREFIX.length)
      const v = sessionStorage.getItem(fullKey)
      if (typeof v === 'string') map[toolId] = v
    }
    writeMirror(map)
  } catch {
    // ignore
  }
}
