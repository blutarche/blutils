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
  onOpenChain?: () => void
  onOpenTweaks?: () => void
  onOpenPalette?: () => void
  tabsEnabled?: boolean
  onToggleTabs?: () => void
}

export function StatusBar({
  contextLabel = 'home',
  onOpenChain,
  onOpenTweaks,
  onOpenPalette,
  tabsEnabled = false,
  onToggleTabs,
}: StatusBarProps) {
  return (
    <footer class="status" aria-label="Status bar">
      <span class="seg seg-tool">{contextLabel}</span>

      <span class="spacer" />

      <span
        class="seg"
        role="button"
        tabIndex={0}
        onClick={onOpenChain}
        aria-label="Open chain mode"
      >
        <Icon name="GitMerge" size={12} />
        chain
      </span>

      <span
        class={`seg ${tabsEnabled ? 'on' : ''}`}
        role="button"
        tabIndex={0}
        onClick={onToggleTabs}
        aria-label={tabsEnabled ? 'Disable Multi-Tab Mode' : 'Enable Multi-Tab Mode'}
        aria-pressed={tabsEnabled}
      >
        <Icon name="Plus" size={12} />
        {tabsEnabled ? 'tabs' : 'single'}
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
