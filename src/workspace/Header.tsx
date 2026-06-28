/**
 * Header — the top bar of the Workspace.
 *
 * Phase 1 renders the breadcrumb and the Commands button (which
 * will open the Palette in Phase 4). The Tab / Chain mode toggles
 * sit between the spacer and the Commands button only when the
 * `showAdvanced` Tweak is on; off by default to keep the header
 * uncluttered for first-time users.
 *
 * The breadcrumb shape is `blutils / <context>` where the context
 * is the active Tool's title (dot-cased) or `home` / `chain` /
 * `not-found`.
 */

import { useTweaks } from '../tweaks/tweaks-context'
import { Icon } from '../icons/Icon'
import { Link } from '../router/router'
import { modKey } from '../app/platform'
import { usePalette } from '../palette/palette-context'

// Note: on the Tauri desktop shell the header bar is the window's drag
// handle, but dragging is driven natively (src-tauri/src/macos_drag.rs)
// rather than by a `data-tauri-drag-region` attribute — WKWebView eats
// the drag clicks under the inset title bar, so the JS path is unreliable
// while the window is focused.

export interface HeaderProps {
  /** Active context label rendered after the home-tag separator. */
  context?: string
  /** Toggle the off-canvas Sidebar drawer (mobile only). */
  onToggleNav?: () => void
  /** Whether the drawer is currently open — drives the toggle's a11y state. */
  navOpen?: boolean
}

export function Header({ context = 'home', onToggleNav, navOpen = false }: HeaderProps) {
  const { tweaks } = useTweaks()
  const palette = usePalette()

  return (
    <header class="header">
      <button
        class="h-menu"
        type="button"
        onClick={onToggleNav}
        aria-label={navOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={navOpen}
      >
        <Icon name={navOpen ? 'X' : 'Menu'} size={18} />
      </button>

      <span class="crumb">
        <Link class="home-tag" href="/">
          blutils
        </Link>
        <span class="sep">/</span>
        <b>{context}</b>
      </span>

      <span class="spacer" />

      {tweaks.showAdvanced && (
        <>
          <button class="h-btn" type="button">
            <Icon name="Plus" size={12} />
            tabs
          </button>
          <button class="h-btn" type="button">
            <Icon name="GitMerge" size={12} />
            chain
          </button>
        </>
      )}

      <button
        class="h-btn"
        type="button"
        onClick={palette.open}
        aria-label="Open command palette"
      >
        <Icon name="Search" size={12} />
        <span class="h-btn-label">commands</span>
        <span class="kbd">{modKey}K</span>
      </button>
    </header>
  )
}
