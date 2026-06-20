/**
 * Shared clipboard write with a single global success signal.
 *
 * Copying is the most-repeated action in a tool catalog, so every
 * Tool writes through `copyText` instead of touching
 * `navigator.clipboard` directly. One code path means one
 * consistent confirmation everywhere: a visually-hidden aria-live
 * announcement for assistive tech (CopyAnnouncer) and a transient
 * "copied · <size>" proof in the Status Bar — rather than 40 Tools
 * each re-implementing (or silently skipping) feedback.
 *
 * Returns true if a write was attempted (clipboard API present and
 * text non-empty) so callers can still drive their own inline
 * "copied" check state synchronously.
 */

export const COPY_EVENT = 'blutils:copy'

export interface CopyEventDetail {
  /** Byte size of the copied text, for the "copied · N B" proof. */
  size: number
}

export function copyText(text: string): boolean {
  if (!text) return false
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false

  navigator.clipboard
    .writeText(text)
    .then(() => {
      if (typeof window === 'undefined') return
      const size =
        typeof Blob !== 'undefined' ? new Blob([text]).size : text.length
      window.dispatchEvent(
        new CustomEvent<CopyEventDetail>(COPY_EVENT, { detail: { size } }),
      )
    })
    .catch(() => {
      /* Clipboard denied (permissions / insecure context). Stay quiet —
       * inline state already reflected the user's intent. */
    })

  return true
}

/** Compact byte/size label: "812 B", "2.4 KB", "1.1 MB". */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
