/**
 * App shell composition.
 *
 * The CSS grid laid out in src/styles/app.css splits the viewport
 * into Sidebar + Header + Workspace + StatusBar. Everything below
 * the App component reads the active Tweaks through the provider.
 *
 * Phase 1 renders Home as the only Workspace content; routing,
 * Tool components, Multi-Tab Mode, Chain Mode, and the Palette
 * arrive in later phases and slot into the same grid.
 */

import { useState } from 'preact/hooks'
import { Sidebar } from '../chrome/Sidebar'
import { StatusBar } from '../chrome/StatusBar'
import { Header } from '../workspace/Header'
import { Workspace } from '../workspace/Workspace'
import { Home } from '../workspace/Home'
import { TweaksProvider } from '../tweaks/tweaks-context'
import { TweaksPanel } from '../tweaks/TweaksPanel'

export function App() {
  return (
    <TweaksProvider>
      <Shell />
    </TweaksProvider>
  )
}

function Shell() {
  const [tweaksOpen, setTweaksOpen] = useState(false)

  return (
    <div class="app">
      <Sidebar />
      <Header />
      <Workspace>
        <Home />
      </Workspace>
      <StatusBar onOpenTweaks={() => setTweaksOpen(true)} />
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
    </div>
  )
}
