/**
 * Visually-hidden live region that voices every clipboard copy.
 *
 * Listens for the global COPY_EVENT (fired by copyText) and writes a
 * polite aria-live message so screen-reader users hear that a copy
 * landed — the non-visual counterpart to the Status Bar's "copied"
 * proof. A trailing counter forces the live region to re-announce
 * back-to-back identical copies (same text would otherwise read once).
 */

import { useEffect, useState } from 'preact/hooks'
import { COPY_EVENT, formatBytes, type CopyEventDetail } from './copy'

export function CopyAnnouncer() {
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let n = 0
    const onCopy = (e: Event) => {
      const detail = (e as CustomEvent<CopyEventDetail>).detail
      n += 1
      const size = detail?.size ?? 0
      // The zero-width-space + count keeps the string unique without
      // being read aloud, so repeated copies always re-announce.
      setMsg(`copied ${formatBytes(size)} to clipboard${'​'.repeat(n % 2)}`)
    }
    window.addEventListener(COPY_EVENT, onCopy)
    return () => window.removeEventListener(COPY_EVENT, onCopy)
  }, [])

  return (
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {msg}
    </div>
  )
}
