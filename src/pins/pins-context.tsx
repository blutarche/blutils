/**
 * Pins context — pinned tool order + recent tool history.
 *
 * Pinned: ordered list of tool ids. Persists to localStorage
 * (pinnedSlice). Defaults to a curated starter set so the sidebar
 * has something useful on first load.
 *
 * Recent: most-recent-first list of tool ids, capped at 12.
 * Persists to localStorage (recentSlice). Updated on every
 * Tool navigation via the `recordVisit` action.
 *
 * G 1–9: global leader-key shortcut bound here (once, on mount)
 * that jumps to the Nth pinned tool (1-indexed). Press `G`, then
 * a digit within 1.2 s. The binding lives in the context so it
 * applies regardless of which component is focused.
 *
 * Why a leader key instead of ⌘1–9: every major browser owns
 * ⌘/Ctrl + digit for tab switching, and `preventDefault()` does
 * not reliably stop the browser from acting first. `G <n>` is
 * conflict-free, platform-neutral (renders identically on Mac
 * and Windows), and matches the GitHub / Linear convention.
 */

import { createContext } from 'preact'
import { useContext, useEffect, useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { readSlice, writeSlice } from '../storage/local'
import { pinnedSlice, recentSlice } from '../storage/schema'
import { toolById } from '../tools/_registry'
import { useRouter } from '../router/router'

interface PinsContextValue {
  pinned: string[]
  recent: string[]
  isPinned: (id: string) => boolean
  pin: (id: string) => void
  unpin: (id: string) => void
  reorder: (from: number, to: number) => void
  recordVisit: (id: string) => void
}

const PinsContext = createContext<PinsContextValue>({
  pinned: [],
  recent: [],
  isPinned: () => false,
  pin: () => {},
  unpin: () => {},
  reorder: () => {},
  recordVisit: () => {},
})

export function PinsProvider({ children }: { children: ComponentChildren }) {
  const [pinned, setPinned] = useState<string[]>(() => {
    // Filter out any ids that no longer exist in the registry.
    const stored = readSlice(pinnedSlice)
    return stored.filter((id) => toolById.has(id))
  })
  const [recent, setRecent] = useState<string[]>(() =>
    readSlice(recentSlice).filter((id) => toolById.has(id)),
  )
  const router = useRouter()

  useEffect(() => {
    writeSlice(pinnedSlice, pinned)
  }, [pinned])

  useEffect(() => {
    writeSlice(recentSlice, recent)
  }, [recent])

  // G <1-9>: navigate to the Nth pinned tool via leader key.
  useEffect(() => {
    let armed = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const disarm = () => {
      armed = false
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
    }

    const isTypingTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false
      if (t.isContentEditable) return true
      const tag = t.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }

    const handler = (e: KeyboardEvent) => {
      // Ignore any chord — leader key is a plain `g`.
      if (e.metaKey || e.ctrlKey || e.altKey) {
        disarm()
        return
      }
      if (isTypingTarget(e.target)) {
        disarm()
        return
      }

      if (armed) {
        const n = parseInt(e.key, 10)
        disarm()
        if (Number.isNaN(n) || n < 1 || n > 9) return
        const id = pinned[n - 1]
        if (!id) return
        const manifest = toolById.get(id)
        if (!manifest) return
        e.preventDefault()
        router.navigate(`/${manifest.category}/${manifest.slug}`)
        return
      }

      if (e.key === 'g' || e.key === 'G') {
        armed = true
        timer = setTimeout(disarm, 1200)
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      disarm()
    }
  }, [pinned, router])

  const isPinned = (id: string) => pinned.includes(id)

  const pin = (id: string) => {
    if (pinned.includes(id)) return
    setPinned((prev) => [...prev, id])
  }

  const unpin = (id: string) => {
    setPinned((prev) => prev.filter((x) => x !== id))
  }

  const reorder = (from: number, to: number) => {
    setPinned((prev) => {
      const next = prev.slice()
      const [item] = next.splice(from, 1)
      if (item !== undefined) next.splice(to, 0, item)
      return next
    })
  }

  const recordVisit = (id: string) => {
    setRecent((prev) => {
      const filtered = prev.filter((x) => x !== id)
      return [id, ...filtered].slice(0, 12)
    })
  }

  return (
    <PinsContext.Provider
      value={{ pinned, recent, isPinned, pin, unpin, reorder, recordVisit }}
    >
      {children}
    </PinsContext.Provider>
  )
}

export function usePins() {
  return useContext(PinsContext)
}
