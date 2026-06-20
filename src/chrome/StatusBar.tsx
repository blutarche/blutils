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

import { useEffect, useState } from 'preact/hooks'
import { Icon } from '../icons/Icon'
import { modKey } from '../app/platform'
import { COPY_EVENT, formatBytes, type CopyEventDetail } from '../clipboard/copy'

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
  // Transient "copied · N B" proof — every copyText() write fires
  // COPY_EVENT; we flash it in place of the context label for ~1.6s.
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onCopy = (e: Event) => {
      const size = (e as CustomEvent<CopyEventDetail>).detail?.size ?? 0
      setCopied(`copied · ${formatBytes(size)}`)
      clearTimeout(timer)
      timer = setTimeout(() => setCopied(null), 1600)
    }
    window.addEventListener(COPY_EVENT, onCopy)
    return () => {
      window.removeEventListener(COPY_EVENT, onCopy)
      clearTimeout(timer)
    }
  }, [])

  return (
    <footer class="status" aria-label="Status bar">
      {copied ? (
        <span class="seg seg-copied">
          <Icon name="Check" size={12} />
          {copied}
        </span>
      ) : (
        <span class="seg seg-tool">{contextLabel}</span>
      )}

      <span class="spacer" />

      <span
        class="seg"
        role="button"
        tabIndex={0}
        onClick={onOpenChain}
        aria-label="Open chain mode"
      >
        <Icon name="GitMerge" size={12} />
        <span class="seg-label">chain</span>
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
        <span class="seg-label">{tabsEnabled ? 'tabs' : 'single'}</span>
      </span>

      <span
        class="seg"
        role="button"
        tabIndex={0}
        onClick={onOpenTweaks}
        aria-label="Open tweaks"
      >
        <Icon name="Settings" size={12} />
        <span class="seg-label">tweaks</span>
      </span>

      <span
        class="seg"
        role="button"
        tabIndex={0}
        onClick={onOpenPalette}
        aria-label="Open command palette"
      >
        <kbd>{modKey}K</kbd>
        <span class="seg-label">palette</span>
      </span>
    </footer>
  )
}
