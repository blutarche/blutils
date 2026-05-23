/**
 * Tabs bar — one row per open tab, plus a `+` button to spawn a
 * fresh Home tab. Rendered between the Header and the Workspace
 * when Multi-Tab Mode is enabled.
 *
 * Tab labels come from the route resolver — '/format/json' shows
 * as 'json.format' via the manifest title; the home route shows
 * as 'home'; unknown paths fall through to a neutral '·'.
 *
 * Closing the active tab hands focus to the neighbor; closing the
 * last tab spawns a fresh Home tab (the invariant lives in
 * tabs-context, not here).
 */

import { Icon } from '../icons/Icon'
import { matchRoute, type RouteMatch } from '../router/match'
import { useTabs } from './tabs-context'

export function TabsBar() {
  const { tabs, activeId, openTab, closeTab, activate } = useTabs()

  return (
    <div class="tabs-bar" role="tablist" aria-label="Open tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        const label = labelFor(matchRoute(tab.path))
        return (
          <div
            key={tab.id}
            class={`tab ${isActive ? 'on' : ''}`}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => activate(tab.id)}
            onMouseDown={(e) => {
              // Middle-click closes the tab, browser-style.
              if (e.button === 1) {
                e.preventDefault()
                closeTab(tab.id)
              }
            }}
          >
            <span class="tab-label">{label}</span>
            <button
              type="button"
              class="tab-close"
              aria-label="Close tab"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
            >
              <Icon name="X" size={10} />
            </button>
          </div>
        )
      })}
      <button
        type="button"
        class="tab-new"
        aria-label="New tab"
        onClick={() => openTab('/')}
      >
        <Icon name="Plus" size={11} />
      </button>
    </div>
  )
}

function labelFor(match: RouteMatch): string {
  switch (match.type) {
    case 'home':
      return 'home'
    case 'tool':
      return match.manifest.title
    case 'chain':
      return 'chain'
    case 'not-found':
      return '·'
  }
}
