/**
 * `useToolInput` — the canonical hook for Tool input state.
 *
 * Reads the initial value from sessionStorage (and from the
 * localStorage mirror via cold-load hydration, when the user has
 * opted into `rememberInputs`). Writes hit sessionStorage
 * synchronously and, when mirrored, push to localStorage on a
 * 500 ms debounce so rapid typing doesn't thrash the JSON encode.
 *
 * Tools call this once per logical input:
 *
 *   const [value, setValue] = useToolInput('format.json', '')
 *
 * The Tool id is the manifest id, which the registry guarantees is
 * unique. The hook never touches storage during SSR (the guards
 * inside session.ts and inputs-mirror.ts short-circuit there).
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useTweaks } from '../tweaks/tweaks-context'
import { readSession, writeSession } from './session'
import {
  hydrateSessionFromMirror,
  inputSessionKey,
  mirrorInputWrite,
} from './inputs-mirror'

const MIRROR_DEBOUNCE_MS = 500

export function useToolInput(
  toolId: string,
  initial = '',
): [string, (next: string) => void] {
  const { tweaks } = useTweaks()

  // First read may benefit from mirror → session hydration. Runs
  // at most once per page load thanks to the idempotency flag
  // inside hydrateSessionFromMirror.
  if (tweaks.rememberInputs) hydrateSessionFromMirror()

  const [value, setValue] = useState<string>(() => {
    const persisted = readSession(inputSessionKey(toolId))
    return persisted ?? initial
  })

  const debounceTimer = useRef<number | null>(null)

  // Mirror state can flip while a Tool is mounted; capture the
  // latest value in a ref so the debounced flush observes the
  // current setting without re-creating the setter.
  const rememberRef = useRef(tweaks.rememberInputs)
  useEffect(() => {
    rememberRef.current = tweaks.rememberInputs
  }, [tweaks.rememberInputs])

  const setNext = useCallback(
    (next: string) => {
      setValue(next)
      writeSession(inputSessionKey(toolId), next)
      if (!rememberRef.current) return
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = window.setTimeout(() => {
        debounceTimer.current = null
        mirrorInputWrite(toolId, next)
      }, MIRROR_DEBOUNCE_MS)
    },
    [toolId],
  )

  useEffect(
    () => () => {
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current)
      }
    },
    [],
  )

  return [value, setNext]
}
