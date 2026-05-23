/**
 * Palette host + global hotkeys.
 *
 * Renders the Palette inside the App tree (so it can use Router
 * and Tweaks context) and owns the open/closed state.
 *
 * Hotkeys:
 *   - ⌘K / Ctrl+K — toggle the palette from anywhere
 *   - `/`         — open the palette when not typing in an
 *                   editable element (input, textarea, contenteditable)
 *   - Esc handles close inside the Palette itself
 *
 * Consumers can call `usePalette().open()` to surface it from a
 * button — used by the status bar's `cmdk` hint.
 */

import {
  createContext,
  type ComponentChildren,
} from 'preact'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'preact/hooks'
import { Palette } from './Palette'

interface PaletteContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

export function PaletteProvider({ children }: { children: ComponentChildren }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((o) => !o), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen((o) => !o)
        return
      }
      if (event.key === '/') {
        const target = event.target as HTMLElement | null
        if (target && isEditable(target)) return
        if (isOpen) return
        event.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const value = useMemo<PaletteContextValue>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  )

  return (
    <PaletteContext.Provider value={value}>
      {children}
      {isOpen && <Palette onClose={close} />}
    </PaletteContext.Provider>
  )
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (!ctx) {
    throw new Error('usePalette must be used inside <PaletteProvider>')
  }
  return ctx
}

function isEditable(el: HTMLElement): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}
