/**
 * Home — the default Workspace view.
 *
 * Wordmark, one-line product description, and the Palette CTA.
 * The categorised tools grid (Phase 6) replaces the empty
 * placeholder below the CTA once the first Tools land.
 */

import { Icon } from '../icons/Icon'

export function Home() {
  return (
    <>
      <h1 class="home-wordmark">
        blutils<span class="dot">.</span>
      </h1>

      <p class="home-sub">
        local-only, lightning-fast developer utilities. open-source.
        everything runs in your browser — nothing leaves it.
      </p>

      <div class="home-cta">
        <Icon name="Search" size={14} />
        <span class="hint">
          press <span class="kbd">⌘K</span> or <span class="kbd">/</span> to
          jump to any tool
        </span>
        <button class="btn primary" type="button">
          open command palette
        </button>
      </div>
    </>
  )
}
