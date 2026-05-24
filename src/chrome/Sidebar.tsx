/**
 * Sidebar — the catalog's left rail.
 *
 * Three vertically-stacked areas inside .side-list:
 *   1. Pinned — user-ordered, reorderable via @dnd-kit/sortable
 *      (pointer + touch + keyboard). ⌘1–9 shortcuts shown inline.
 *      Pin/unpin via Palette Commands only.
 *   2. Categorised catalog — all registered Tools grouped by
 *      category, filtered by the search input.
 *   3. Footer — GitHub link + version.
 *
 * The filter input focuses with `/` from anywhere outside an
 * editable element (wired in palette-context; the same guard is
 * used there).
 */

import type { ToolManifest } from '../types'
import { tools, toolsByCategory, toolById, type CategorySection } from '../tools/_registry'
import { Icon } from '../icons/Icon'
import { isIconName, type IconName } from '../icons/icon-set'
import { Link } from '../router/router'
import { BrandMark } from './BrandMark'
import { GithubMark } from './GithubMark'
import { usePins } from '../pins/pins-context'
import { useEffect, useState } from 'preact/hooks'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface SidebarProps {
  activeToolId?: string
}

export function Sidebar({ activeToolId }: SidebarProps) {
  const [q, setQ] = useState('')
  const [isClient, setIsClient] = useState(false)
  const sections = toolsByCategory()
  const empty = tools.length === 0
  const { pinned, reorder } = usePins()

  useEffect(() => { setIsClient(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = pinned.indexOf(String(active.id))
    const to = pinned.indexOf(String(over.id))
    if (from !== -1 && to !== -1) reorder(from, to)
  }

  // Filter: normalised query against name + title + id + tags.
  const lq = q.toLowerCase()
  const filterTool = (m: ToolManifest) => {
    if (!lq) return true
    return (
      m.name.toLowerCase().includes(lq) ||
      m.title.toLowerCase().includes(lq) ||
      m.id.toLowerCase().includes(lq) ||
      m.tags.some((t) => t.toLowerCase().includes(lq))
    )
  }

  const pinnedManifests = pinned
    .map((id) => toolById.get(id))
    .filter((m): m is ToolManifest => !!m && filterTool(m))

  const filteredSections = sections
    .map((s) => ({ ...s, tools: s.tools.filter(filterTool) }))
    .filter((s) => s.tools.length > 0)

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
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        {!q && <span class="kbd-hint">/</span>}
      </div>

      <div class="side-list">
        {empty ? (
          <p class="side-empty">no tools registered yet.</p>
        ) : (
          <>
            {pinnedManifests.length > 0 && (
              <>
                <SectionHeader name="pinned" count={pinnedManifests.length} />
                {isClient ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pinnedManifests.map((m) => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pinnedManifests.map((m, i) => (
                        <SortableToolItem
                          key={m.id}
                          manifest={m}
                          active={m.id === activeToolId}
                          shortcutIndex={pinned.indexOf(m.id)}
                          shortcutN={i < 9 ? i + 1 : undefined}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  pinnedManifests.map((m) => (
                    <ToolItem
                      key={m.id}
                      manifest={m}
                      active={m.id === activeToolId}
                    />
                  ))
                )}
              </>
            )}

            {filteredSections.map((s) => (
              <Section key={s.category} section={s} activeToolId={activeToolId} />
            ))}

            {pinnedManifests.length === 0 && filteredSections.length === 0 && (
              <p class="side-empty">no matches</p>
            )}
          </>
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
        <span class="side-foot-dot" />
        <a
          class="side-foot-link"
          href="https://blutarche.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          blutarche.dev
        </a>
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
  const [collapsed, setCollapsed] = useState(false)
  return (
    <>
      <SectionHeader
        name={section.name}
        count={section.tools.length}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      {!collapsed &&
        section.tools.map((m) => (
          <ToolItem key={m.id} manifest={m} active={m.id === activeToolId} />
        ))}
    </>
  )
}

function SectionHeader({
  name,
  count,
  collapsed,
  onToggle,
}: {
  name: string
  count: number
  collapsed?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      class={`side-section${onToggle ? ' clickable' : ''}`}
      onClick={onToggle}
      role={onToggle ? 'button' : undefined}
      aria-expanded={onToggle ? !collapsed : undefined}
    >
      <span>{name}</span>
      <span class="count">{count}</span>
      {onToggle && (
        <span class={`side-section-chevron${collapsed ? ' collapsed' : ''}`}>
          <Icon name="ChevronDown" size={10} />
        </span>
      )}
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
  const iconName: IconName = isIconName(manifest.icon) ? manifest.icon : 'Search'
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

function SortableToolItem({
  manifest,
  active,
  shortcutN,
}: {
  manifest: ToolManifest
  active: boolean
  shortcutIndex: number
  shortcutN?: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: manifest.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  }

  const iconName: IconName = isIconName(manifest.icon) ? manifest.icon : 'Search'

  return (
    <div ref={setNodeRef} style={style} {...(attributes as unknown as Record<string, unknown>)}>
      <Link
        class={`side-item${active ? ' on' : ''}`}
        href={`/${manifest.category}/${manifest.slug}`}
        title={manifest.description}
        {...listeners}
      >
        <span class="ic">
          <Icon name={iconName} size={14} />
        </span>
        <span class="label">{manifest.name.toLowerCase()}</span>
        {shortcutN !== undefined && (
          <span class="side-shortcut">⌘{shortcutN}</span>
        )}
      </Link>
    </div>
  )
}
