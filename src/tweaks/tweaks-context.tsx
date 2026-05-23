/**
 * Tweaks context — theme, density, and feature toggles.
 *
 * The provider:
 *   - reads the persisted Tweaks slice on mount (defaults if
 *     absent or malformed);
 *   - applies `data-theme` and `data-density` to <html> on every
 *     change so token CSS reflects the active mode;
 *   - writes back to localStorage on every change.
 *
 * Consumers use `useTweaks()` to read the current Tweaks and
 * `useTweaks().setTweak(key, value)` to update one field.
 *
 * The initial document attributes are set inside the lazy
 * useState initialiser so the first render paints with the
 * persisted values applied — no flash from default-dark to
 * stored-light on cold load.
 */

import { createContext, type ComponentChildren } from 'preact'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks'
import type { Tweaks } from '../types'
import { tweaksSlice } from '../storage/schema'
import { readSlice, writeSlice } from '../storage/local'
import {
  clearInputsMirror,
  snapshotSessionToMirror,
} from '../storage/inputs-mirror'

interface TweaksContextValue {
  tweaks: Tweaks
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void
}

const TweaksContext = createContext<TweaksContextValue | null>(null)

function applyToDocument(tweaks: Tweaks): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', tweaks.theme)
  root.setAttribute('data-density', tweaks.density)
}

export function TweaksProvider({ children }: { children: ComponentChildren }) {
  const [tweaks, setTweaks] = useState<Tweaks>(() => {
    const initial = readSlice(tweaksSlice)
    applyToDocument(initial)
    return initial
  })

  useEffect(() => {
    applyToDocument(tweaks)
    writeSlice(tweaksSlice, tweaks)
  }, [tweaks])

  // Mirror Tool inputs to localStorage on rememberInputs transitions.
  // Off → on snapshots any inputs already typed this session so they
  // survive the next reload. On → off drops the mirror immediately;
  // sessionStorage stays so the current tab keeps its inputs.
  const prevRemember = useRef(tweaks.rememberInputs)
  useEffect(() => {
    const cur = tweaks.rememberInputs
    const prev = prevRemember.current
    if (prev !== cur) {
      if (cur) snapshotSessionToMirror()
      else clearInputsMirror()
    }
    prevRemember.current = cur
  }, [tweaks.rememberInputs])

  const setTweak = useCallback(
    <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
      setTweaks((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const value = useMemo<TweaksContextValue>(
    () => ({ tweaks, setTweak }),
    [tweaks, setTweak],
  )

  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>
}

export function useTweaks(): TweaksContextValue {
  const ctx = useContext(TweaksContext)
  if (!ctx) {
    throw new Error('useTweaks must be used inside <TweaksProvider>')
  }
  return ctx
}
