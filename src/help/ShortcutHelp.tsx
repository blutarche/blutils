/**
 * Keyboard shortcut overlay — opened with `?`.
 *
 * A keyboard-first tool should be able to teach its own keys without
 * sending the user to docs. The list is a single source rendered
 * here, so the displayed keys can't drift from the bindings wired in
 * palette-context (⌘K, /, esc) and pins-context (g 1–9).
 */

import { useEffect } from 'preact/hooks'
import { Icon } from '../icons/Icon'
import { modKey } from '../app/platform'
import { useFocusTrap } from '../app/use-focus-trap'

interface Shortcut {
  keys: string[]
  label: string
}

interface Group {
  title: string
  items: Shortcut[]
}

const GROUPS: Group[] = [
  {
    title: 'general',
    items: [
      { keys: [`${modKey}K`], label: 'open the command palette' },
      { keys: ['/'], label: 'filter the tool catalog' },
      { keys: ['?'], label: 'show this shortcut sheet' },
      { keys: ['esc'], label: 'close palette, panels, or menu' },
    ],
  },
  {
    title: 'navigation',
    items: [
      { keys: ['g', '1–9'], label: 'jump to a pinned tool' },
      { keys: ['tab'], label: 'move between controls' },
    ],
  },
  {
    title: 'clipboard',
    items: [{ keys: ['click'], label: 'copy — confirmed in the status bar' }],
  },
]

export function ShortcutHelp({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div class="help-backdrop" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        class="help"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="help-head">
          <span>keyboard shortcuts</span>
          <button class="help-close" type="button" onClick={onClose} aria-label="Close">
            <Icon name="X" size={14} />
          </button>
        </div>
        <div class="help-body">
          {GROUPS.map((g) => (
            <div class="help-group" key={g.title}>
              <div class="help-group-h">{g.title}</div>
              {g.items.map((it) => (
                <div class="help-row" key={it.label}>
                  <span class="help-label">{it.label}</span>
                  <span class="help-keys">
                    {it.keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
