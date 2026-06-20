/**
 * App shell composition.
 *
 * The CSS grid laid out in src/styles/app.css splits the viewport
 * into Sidebar + Header + Workspace + StatusBar. The Workspace
 * content dispatches on the current route — Home / lazy Tool /
 * Chain placeholder / NotFound.
 *
 * Document title and the breadcrumb / status-bar context labels
 * update from the route on every navigation.
 */

import { Suspense } from 'preact/compat'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { Sidebar } from '../chrome/Sidebar'
import { StatusBar } from '../chrome/StatusBar'
import { Header } from '../workspace/Header'
import { Workspace } from '../workspace/Workspace'
import { Home } from '../workspace/Home'
import { ToolSkeleton } from '../workspace/ToolSkeleton'
import { TweaksProvider } from '../tweaks/tweaks-context'
import { TweaksPanel } from '../tweaks/TweaksPanel'
import { RouterProvider, useRouter } from '../router/router'
import { matchRoute, type RouteMatch } from '../router/match'
import { componentById } from '../tools/_registry'
import { PaletteProvider, usePalette } from '../palette/palette-context'
import { TabsProvider, useTabs } from '../tabs/tabs-context'
import { TabsBar } from '../tabs/TabsBar'
import { Chain } from '../chain/Chain'
import { PinsProvider, usePins } from '../pins/pins-context'
import { CopyAnnouncer } from '../clipboard/CopyAnnouncer'
import { ShortcutHelp } from '../help/ShortcutHelp'

export interface AppProps {
  /** Initial pathname for SSR/prerender. Client ignores this. */
  initialPath?: string
}

export function App({ initialPath }: AppProps) {
  return (
    <TweaksProvider>
      <RouterProvider initialPath={initialPath}>
        <PinsProvider>
          <TabsProvider>
            <PaletteProvider>
              <Shell />
            </PaletteProvider>
          </TabsProvider>
        </PinsProvider>
      </RouterProvider>
    </TweaksProvider>
  )
}

function Shell() {
  const { pathname, navigate } = useRouter()
  const match = useMemo(() => matchRoute(pathname), [pathname])
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const palette = usePalette()
  const tabs = useTabs()
  const pins = usePins()

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = titleFor(match)
    }
  }, [match])

  // Close the mobile nav drawer whenever the route changes (the user
  // tapped a tool) and reset the content scroll so each tool opens at
  // the top rather than mid-page.
  useEffect(() => {
    setNavOpen(false)
    document.querySelector('.main-inner')?.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  // If the viewport grows past the drawer breakpoint while the drawer
  // is open, close it so the desktop rail isn't left in an open state.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 761px)')
    const onChange = () => {
      if (mq.matches) setNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // `?` toggles the keyboard shortcut sheet — but not while typing in
  // a field (where `?` is a literal character).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement) {
        if (t.isContentEditable) return
        const tag = t.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      }
      e.preventDefault()
      setHelpOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (match.type === 'tool') pins.recordVisit(match.manifest.id)
    // recordVisit is stable; match.manifest.id only changes when
    // the Tool actually changes — intentional dep list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const activeToolId = match.type === 'tool' ? match.manifest.id : undefined

  return (
    <div
      class={`app ${tabs.enabled ? 'with-tabs' : ''} ${navOpen ? 'nav-open' : ''}`}
    >
      <a class="skip-link" href="#main">
        skip to content
      </a>
      <Sidebar
        activeToolId={activeToolId}
        onCloseNav={() => setNavOpen(false)}
        trapFocus={navOpen}
      />
      <Header
        context={contextLabelFor(match)}
        onToggleNav={() => setNavOpen((v) => !v)}
        navOpen={navOpen}
      />
      {tabs.enabled && <TabsBar />}
      <Workspace
        flush={match.type === 'chain'}
        routeKey={match.type === 'tool' ? match.manifest.id : match.type}
      >
        <RouteView match={match} />
      </Workspace>
      {navOpen && (
        <div
          class="nav-scrim"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <StatusBar
        contextLabel={statusLabelFor(match)}
        onOpenChain={() => navigate('/chain')}
        onOpenTweaks={() => setTweaksOpen(true)}
        onOpenPalette={palette.open}
        tabsEnabled={tabs.enabled}
        onToggleTabs={() => tabs.setEnabled(!tabs.enabled)}
      />
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CopyAnnouncer />
    </div>
  )
}

function RouteView({ match }: { match: RouteMatch }) {
  switch (match.type) {
    case 'home':
      return <Home />
    case 'tool': {
      const Component = componentById.get(match.manifest.id)
      if (!Component) return <NotFound />
      return (
        <Suspense fallback={<ToolSkeleton manifest={match.manifest} />}>
          <Component initialState={match.initialState} />
        </Suspense>
      )
    }
    case 'chain':
      return <Chain />
    case 'not-found':
      return <NotFound />
  }
}

function NotFound() {
  return (
    <div>
      <h1 class="route-heading">not found</h1>
      <p class="route-copy">
        this route doesn't exist. open the command palette or the sidebar to
        jump to a tool.
      </p>
    </div>
  )
}

function contextLabelFor(match: RouteMatch): string {
  switch (match.type) {
    case 'home':
      return 'home'
    case 'tool':
      return match.manifest.title
    case 'chain':
      return 'chain'
    case 'not-found':
      return 'not-found'
  }
}

function statusLabelFor(match: RouteMatch): string {
  switch (match.type) {
    case 'home':
      return 'home'
    case 'tool':
      return match.manifest.title
    case 'chain':
      return 'chain'
    case 'not-found':
      return '404'
  }
}

function titleFor(match: RouteMatch): string {
  switch (match.type) {
    case 'home':
      return 'blutils — local-only developer utilities'
    case 'tool':
      return match.manifest.seo.title
    case 'chain':
      return 'chain — blutils'
    case 'not-found':
      return 'not found — blutils'
  }
}
