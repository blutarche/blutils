/**
 * Multi-Tab Mode — context, state, and persistence.
 *
 * When enabled, the workspace shows a TabsBar; each tab pins a
 * pathname and the active tab drives the router. When disabled,
 * navigation is direct (the existing single-mode flow). The mode
 * toggle persists alongside the tab list so a cold reload comes
 * back to the same shape.
 *
 * URL ↔ tab sync:
 *
 *   - Switching tabs calls router.navigate(tab.path).
 *   - Direct pathname changes (URL bar, Link click, palette) are
 *     observed and folded into the active tab's path.
 *   - Opening a new tab spawns at '/' (Home) and becomes active.
 *
 * The "fresh Home tab when the last tab closes" invariant lives
 * inside closeTab — closing the only remaining tab replaces it
 * with a fresh Home tab instead of leaving the bar empty.
 */

import {
  createContext,
  type ComponentChildren,
} from 'preact'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks'
import { useRouter } from '../router/router'
import { readSlice, writeSlice } from '../storage/local'
import {
  tabsSlice,
  type TabRecord,
  type TabsSliceShape,
} from '../storage/schema'

interface TabsContextValue {
  enabled: boolean
  tabs: TabRecord[]
  activeId: string | null
  setEnabled: (next: boolean) => void
  openTab: (path?: string) => void
  closeTab: (id: string) => void
  activate: (id: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function TabsProvider({ children }: { children: ComponentChildren }) {
  const { pathname, navigate } = useRouter()
  const [state, setState] = useState<TabsSliceShape>(() => readSlice(tabsSlice))

  // Persist on every change.
  useEffect(() => {
    writeSlice(tabsSlice, state)
  }, [state])

  // When the mode flips on with no tabs yet, seed with the current
  // pathname so the user isn't dropped into an empty bar.
  useEffect(() => {
    if (!state.enabled) return
    if (state.tabs.length > 0) return
    const seed: TabRecord = { id: genId(), path: pathname }
    setState((prev) => ({
      ...prev,
      tabs: [seed],
      activeId: seed.id,
    }))
  }, [state.enabled])

  // Sync the active tab's path with the URL. When the user
  // navigates via Link / palette / address bar, fold the change
  // into the active tab so the row matches what's on screen.
  const lastNavTargetRef = useRef<string | null>(null)
  useEffect(() => {
    if (!state.enabled) return
    if (state.activeId === null) return
    if (lastNavTargetRef.current === pathname) {
      lastNavTargetRef.current = null
      return
    }
    setState((prev) => {
      const tabs = prev.tabs.map((t) =>
        t.id === prev.activeId && t.path !== pathname ? { ...t, path: pathname } : t,
      )
      // Skip the React re-render if nothing changed.
      const changed = tabs.some((t, i) => t !== prev.tabs[i])
      return changed ? { ...prev, tabs } : prev
    })
  }, [pathname, state.enabled, state.activeId])

  const setEnabled = useCallback(
    (next: boolean) => {
      setState((prev) => {
        if (prev.enabled === next) return prev
        if (!next) {
          // Leaving multi mode — keep the persisted tabs but
          // navigate to the active tab's path (or home) so the
          // single-mode workspace shows something sensible.
          const active = prev.tabs.find((t) => t.id === prev.activeId)
          if (active && active.path !== pathname) {
            lastNavTargetRef.current = active.path
            navigate(active.path)
          }
          return { ...prev, enabled: false }
        }
        return { ...prev, enabled: true }
      })
    },
    [navigate, pathname],
  )

  const openTab = useCallback(
    (path?: string) => {
      const dest = path ?? '/'
      const tab: TabRecord = { id: genId(), path: dest }
      setState((prev) => ({
        enabled: true,
        tabs: [...prev.tabs, tab],
        activeId: tab.id,
      }))
      if (dest !== pathname) {
        lastNavTargetRef.current = dest
        navigate(dest)
      }
    },
    [navigate, pathname],
  )

  const closeTab = useCallback(
    (id: string) => {
      setState((prev) => {
        const idx = prev.tabs.findIndex((t) => t.id === id)
        if (idx < 0) return prev
        const next = prev.tabs.filter((_, i) => i !== idx)
        let activeId = prev.activeId
        if (id === prev.activeId) {
          // Last tab closed → fresh Home tab, per the invariant.
          if (next.length === 0) {
            const home: TabRecord = { id: genId(), path: '/' }
            lastNavTargetRef.current = '/'
            navigate('/')
            return { enabled: prev.enabled, tabs: [home], activeId: home.id }
          }
          // Otherwise pick the neighbor — previous if any, else next.
          const neighbor = next[idx - 1] ?? next[idx] ?? next[next.length - 1]!
          activeId = neighbor.id
          if (neighbor.path !== pathname) {
            lastNavTargetRef.current = neighbor.path
            navigate(neighbor.path)
          }
        }
        return { ...prev, tabs: next, activeId }
      })
    },
    [navigate, pathname],
  )

  const activate = useCallback(
    (id: string) => {
      setState((prev) => {
        if (prev.activeId === id) return prev
        const target = prev.tabs.find((t) => t.id === id)
        if (!target) return prev
        if (target.path !== pathname) {
          lastNavTargetRef.current = target.path
          navigate(target.path)
        }
        return { ...prev, activeId: id }
      })
    },
    [navigate, pathname],
  )

  const value = useMemo<TabsContextValue>(
    () => ({
      enabled: state.enabled,
      tabs: state.tabs,
      activeId: state.activeId,
      setEnabled,
      openTab,
      closeTab,
      activate,
    }),
    [state, setEnabled, openTab, closeTab, activate],
  )

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) {
    throw new Error('useTabs must be used inside <TabsProvider>')
  }
  return ctx
}
