/**
 * Focus trap for modal surfaces (shortcut overlay, mobile nav drawer).
 *
 * When `active`, focus moves into the container, Tab/Shift+Tab cycle
 * within it instead of escaping to the obscured shell behind, and the
 * previously-focused element is restored on close. This is the
 * keyboard contract an `aria-modal` surface promises; without it the
 * overlay only *looks* modal.
 *
 * Returns a ref to attach to the container. The container should carry
 * `tabIndex={-1}` so it can hold focus when it has no focusable child.
 */

import { useEffect, useRef } from 'preact/hooks'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!active) return
    const container = ref.current
    if (!container) return

    const previous = document.activeElement as HTMLElement | null

    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )

    // Move focus in — first interactive child, or the container itself.
    // Deferred so a container that animates in from hidden (the mobile
    // drawer toggles `visibility`) has had its style recalculated and is
    // focusable. Re-asserted once shortly after in case a reflow on open
    // bounced focus back out; the guard makes the second pass a no-op
    // when focus already landed.
    const focusIn = () => {
      if (!container.contains(document.activeElement)) {
        ;(focusable()[0] ?? container).focus()
      }
    }
    const t1 = setTimeout(focusIn, 0)
    const t2 = setTimeout(focusIn, 80)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) {
        e.preventDefault()
        container.focus()
        return
      }
      const firstEl = items[0]!
      const lastEl = items[items.length - 1]!
      const current = document.activeElement
      if (e.shiftKey) {
        if (current === firstEl || !container.contains(current)) {
          e.preventDefault()
          lastEl.focus()
        }
      } else if (current === lastEl || !container.contains(current)) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.removeEventListener('keydown', onKey, true)
      // Restore focus to the opener if it's still in the document.
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [active])

  return ref
}
