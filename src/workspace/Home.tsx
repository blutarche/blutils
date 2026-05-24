/**
 * Home — the default Workspace view.
 *
 * Wordmark, one-line product description, and the Palette CTA.
 * The categorised tools grid (Phase 6) replaces the empty
 * placeholder below the CTA once the first Tools land.
 */

import { Icon } from '../icons/Icon'
import { usePalette } from '../palette/palette-context'
import { modKey } from '../app/platform'

export function Home() {
  const palette = usePalette()

  return (
    <>
      <h1 class="home-wordmark">
        <span class="bracket">bl</span>utils<span class="bracket">.</span>
      </h1>

      <p class="home-sub">
        local-only, lightning-fast developer utilities. open-source.
        everything runs in your browser — nothing leaves it.
      </p>

      <div class="home-cta" onClick={palette.open} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && palette.open()}
      >
        <Icon name="Search" size={14} />
        <span class="hint">
          press <span class="kbd">{modKey}K</span> or <span class="kbd">/</span> to
          jump to any tool
        </span>
        <button class="btn primary" type="button">
          open command palette
        </button>
      </div>
    </>
  )
}
