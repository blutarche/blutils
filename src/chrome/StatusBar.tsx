/**
 * Status Bar — the bottom Chrome surface. Always visible.
 *
 * Phase 1 renders the static shape: "local" indicator on the
 * left (confirming the locality principle at a glance), the
 * current context ("home" by default), and the right-aligned
 * cluster of mode segments (Chain, Tabs, Palette).
 *
 * The Palette segment opens the Command Palette; Chain and Tabs
 * segments are still placeholders pending Phases 8 and 9.
 */

import { Icon } from '../icons/Icon'

export interface StatusBarProps {
  contextLabel?: string
  onOpenTweaks?: () => void
  onOpenPalette?: () => void
}

export function StatusBar({
  contextLabel = 'home',
  onOpenTweaks,
  onOpenPalette,
}: StatusBarProps) {
  return (
    <footer class="status" aria-label="Status bar">
      <span class="seg ok" title="No data leaves the browser">
        <span class="dot" />
        local
      </span>

      <span class="seg seg-tool">{contextLabel}</span>

      <span class="spacer" />

      <span class="seg" role="button" tabIndex={-1}>
        <Icon name="GitMerge" size={12} />
        chain
      </span>

      <span class="seg" role="button" tabIndex={-1}>
        <Icon name="Plus" size={12} />
        single
      </span>

      <span
        class="seg"
        role="button"
        tabIndex={0}
        onClick={onOpenTweaks}
        aria-label="Open tweaks"
      >
        <Icon name="Settings" size={12} />
        tweaks
      </span>

      <span
        class="seg"
        role="button"
        tabIndex={0}
        onClick={onOpenPalette}
        aria-label="Open command palette"
      >
        <kbd>⌘K</kbd>
        palette
      </span>
    </footer>
  )
}
