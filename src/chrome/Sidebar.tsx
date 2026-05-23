/**
 * Sidebar — the catalog's left rail.
 *
 * Renders the registered Tool catalog as categorised sections
 * inside .side-list. Sections and items live inside the same
 * scroll container so they scroll together. When no Tools are
 * registered, a single "tools" section header with an empty
 * placeholder is rendered.
 *
 * Items use the router's <Link> so navigation stays SPA-internal;
 * the active Tool is highlighted via .on which also paints the
 * 2 px accent rail on the item's left edge.
 */

import type { ToolManifest } from '../types'
import { tools, toolsByCategory, type CategorySection } from '../tools/_registry'
import { Icon } from '../icons/Icon'
import { isIconName, type IconName } from '../icons/icon-set'
import { Link } from '../router/router'
import { BrandMark } from './BrandMark'
import { GithubMark } from './GithubMark'

const VERSION = `v${__APP_VERSION__}`

export interface SidebarProps {
  activeToolId?: string
}

export function Sidebar({ activeToolId }: SidebarProps) {
  const sections = toolsByCategory()
  const empty = tools.length === 0

  return (
    <aside class="side" aria-label="Tool catalog">
      <Link class="side-brand" href="/" aria-label="Go home">
        <BrandMark />
        <span class="name">
          <span class="bracket">bl</span>utils<span class="bracket">.</span>
        </span>
      </Link>

      <div class="side-search">
        <span class="ico">
          <Icon name="Search" size={12} />
        </span>
        <input
          type="text"
          placeholder="filter"
          aria-label="Filter tools"
          spellcheck={false}
        />
        <span class="kbd-hint">/</span>
      </div>

      <div class="side-list">
        {empty ? (
          <>
            <SectionHeader name="tools" count={0} />
            <p class="side-empty">
              no tools registered yet — manifests arrive in phase 2.
            </p>
          </>
        ) : (
          sections.map((s) => (
            <Section key={s.category} section={s} activeToolId={activeToolId} />
          ))
        )}
      </div>

      <div class="side-foot">
        <a
          class="side-foot-gh"
          href="https://github.com/blutarche/blutils"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source on GitHub"
        >
          <GithubMark size={12} />
        </a>
        <span>mit</span>
        <span class="side-foot-sep" />
        <span>{VERSION}</span>
      </div>
    </aside>
  )
}

function Section({
  section,
  activeToolId,
}: {
  section: CategorySection
  activeToolId?: string
}) {
  return (
    <>
      <SectionHeader name={section.name} count={section.tools.length} />
      {section.tools.map((m) => (
        <ToolItem key={m.id} manifest={m} active={m.id === activeToolId} />
      ))}
    </>
  )
}

function SectionHeader({ name, count }: { name: string; count: number }) {
  return (
    <div class="side-section">
      <span>{name}</span>
      <span class="count">{count}</span>
    </div>
  )
}

function ToolItem({
  manifest,
  active,
}: {
  manifest: ToolManifest
  active: boolean
}) {
  const iconName: IconName = isIconName(manifest.icon)
    ? manifest.icon
    : 'Search'
  return (
    <Link
      class={`side-item${active ? ' on' : ''}`}
      href={`/${manifest.category}/${manifest.slug}`}
      title={manifest.description}
    >
      <span class="ic">
        <Icon name={iconName} size={14} />
      </span>
      <span class="label">{manifest.name.toLowerCase()}</span>
    </Link>
  )
}
