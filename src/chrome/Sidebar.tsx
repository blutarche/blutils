/**
 * Sidebar — the catalog's left rail.
 *
 * Renders the registered Tool catalog as categorised sections
 * inside .side-list. Sections and items live inside the same
 * scroll container so they scroll together. When no Tools are
 * registered, a single "tools" section header with an empty
 * placeholder is rendered.
 *
 * Phase 2: items are anchors with href set to the Tool URL, but
 * navigation is suppressed (preventDefault) because the router
 * lands in Phase 3. The Tool component itself does not render
 * yet — this commit only proves the catalog → Sidebar pipeline.
 */

import type { ToolManifest } from '../types'
import { tools, toolsByCategory, type CategorySection } from '../tools/_registry'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/icon-set'
import { isIconName } from '../icons/icon-set'
import { BrandMark } from './BrandMark'
import { GithubMark } from './GithubMark'

const VERSION = `v${__APP_VERSION__}`

export function Sidebar() {
  const sections = toolsByCategory()
  const empty = tools.length === 0

  return (
    <aside class="side" aria-label="Tool catalog">
      <div class="side-brand">
        <BrandMark />
        <span class="name">blutils</span>
      </div>

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
          sections.map((s) => <Section key={s.category} section={s} />)
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

function Section({ section }: { section: CategorySection }) {
  return (
    <>
      <SectionHeader name={section.name} count={section.tools.length} />
      {section.tools.map((m) => (
        <ToolItem key={m.id} manifest={m} />
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

function ToolItem({ manifest }: { manifest: ToolManifest }) {
  const iconName: IconName = isIconName(manifest.icon)
    ? manifest.icon
    : ('Search' satisfies IconName) // fallback — registry sweep will tighten this in a later phase
  return (
    <a
      class="side-item"
      href={`/${manifest.category}/${manifest.slug}`}
      onClick={(e) => e.preventDefault()}
      title={manifest.description}
    >
      <span class="ic">
        <Icon name={iconName} size={14} />
      </span>
      <span class="label">{manifest.name.toLowerCase()}</span>
    </a>
  )
}
