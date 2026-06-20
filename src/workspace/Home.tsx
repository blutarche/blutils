/**
 * Home — the default Workspace view.
 *
 * A compact hero (wordmark + thesis + Palette CTA) over a browsable
 * catalog: a "recent" row (when the visitor has history) followed by
 * every Tool grouped by Category as a grid of cards. The catalog is
 * the primary way to discover and reach Tools — and on mobile, where
 * the Sidebar is hidden behind the menu, it is the main navigation.
 */

import { useEffect, useState } from 'preact/hooks'
import { Icon } from '../icons/Icon'
import { Link } from '../router/router'
import { usePalette } from '../palette/palette-context'
import { usePins } from '../pins/pins-context'
import { modKey } from '../app/platform'
import { tools, toolsByCategory, toolById, prefetchTool } from '../tools/_registry'
import { isIconName, type IconName } from '../icons/icon-set'
import type { ToolManifest } from '../types'

export function Home() {
  const palette = usePalette()
  const { recent } = usePins()
  const sections = toolsByCategory()

  // `recent` is read from localStorage, which is empty during
  // prerender. Gate the section on a post-mount flag so the first
  // client render matches the prerendered HTML, then reveal recents.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const recentManifests = (mounted ? recent : [])
    .map((id) => toolById.get(id))
    .filter((m): m is ToolManifest => !!m)
    .slice(0, 6)

  return (
    <div class="home">
      <header class="home-hero">
        <h1 class="home-wordmark">
          <span class="bracket">bl</span>utils<span class="bracket">.</span>
        </h1>

        <p class="home-sub">
          local-only, lightning-fast developer utilities. open-source.
          everything runs in your browser — nothing leaves it.
        </p>

        <button class="home-cta" type="button" onClick={palette.open}>
          <Icon name="Search" size={14} />
          <span class="hint">
            press <span class="kbd">{modKey}K</span> or <span class="kbd">/</span>{' '}
            to jump to any tool
          </span>
          <span class="btn primary" aria-hidden="true">
            open command palette
          </span>
        </button>
      </header>

      {recentManifests.length > 0 && (
        <section class="home-section">
          <h2 class="home-section-h">
            <Icon name="Clock" size={11} />
            <span>recent</span>
          </h2>
          <div class="home-grid">
            {recentManifests.map((m) => (
              <ToolCard key={m.id} manifest={m} />
            ))}
          </div>
        </section>
      )}

      {sections.map((s) => (
        <section class="home-section" key={s.category}>
          <h2 class="home-section-h">
            <span>{s.name}</span>
            <span class="count">{s.tools.length}</span>
          </h2>
          <div class="home-grid">
            {s.tools.map((m) => (
              <ToolCard key={m.id} manifest={m} />
            ))}
          </div>
        </section>
      ))}

      <footer class="home-foot">
        {tools.length} tools · everything runs locally · no tracking, no network
      </footer>
    </div>
  )
}

function ToolCard({ manifest }: { manifest: ToolManifest }) {
  const iconName: IconName = isIconName(manifest.icon) ? manifest.icon : 'Search'
  const warm = () => prefetchTool(manifest.id)
  return (
    <Link
      class="tool-card"
      href={`/${manifest.category}/${manifest.slug}`}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
    >
      <span class="tool-card-ic">
        <Icon name={iconName} size={16} />
      </span>
      <span class="tool-card-body">
        <span class="tool-card-name">
          {manifest.name.toLowerCase()}
          {manifest.status === 'experimental' && (
            <span class="tool-card-tag">exp</span>
          )}
          {manifest.status === 'beta' && <span class="tool-card-tag">beta</span>}
        </span>
        <span class="tool-card-desc">{manifest.description}</span>
      </span>
    </Link>
  )
}
