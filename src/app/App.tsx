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
import { TweaksProvider } from '../tweaks/tweaks-context'
import { TweaksPanel } from '../tweaks/TweaksPanel'
import { RouterProvider, useRouter } from '../router/router'
import { matchRoute, type RouteMatch } from '../router/match'
import { componentById } from '../tools/_registry'

export function App() {
  return (
    <TweaksProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </TweaksProvider>
  )
}

function Shell() {
  const { pathname } = useRouter()
  const match = useMemo(() => matchRoute(pathname), [pathname])
  const [tweaksOpen, setTweaksOpen] = useState(false)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = titleFor(match)
    }
  }, [match])

  const activeToolId = match.type === 'tool' ? match.manifest.id : undefined

  return (
    <div class="app">
      <Sidebar activeToolId={activeToolId} />
      <Header context={contextLabelFor(match)} />
      <Workspace>
        <RouteView match={match} />
      </Workspace>
      <StatusBar
        contextLabel={statusLabelFor(match)}
        onOpenTweaks={() => setTweaksOpen(true)}
      />
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
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
        <Suspense fallback={<p class="route-loading">loading…</p>}>
          <Component />
        </Suspense>
      )
    }
    case 'chain':
      return <ChainPlaceholder />
    case 'not-found':
      return <NotFound />
  }
}

function ChainPlaceholder() {
  return (
    <div>
      <h1 class="route-heading">chain</h1>
      <p class="route-copy">chain mode arrives in phase 9.</p>
    </div>
  )
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
