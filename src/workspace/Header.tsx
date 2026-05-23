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

export interface HeaderProps {
  /** Active context label rendered after the home-tag separator. */
  context?: string
}

export function Header({ context = 'home' }: HeaderProps) {
  const { tweaks } = useTweaks()

  return (
    <header class="header">
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

      <button class="h-btn" type="button">
        <Icon name="Search" size={12} />
        commands
        <span class="kbd">⌘K</span>
      </button>
    </header>
  )
}
