/**
 * Platform detection for keyboard-shortcut affordances.
 *
 * `modKey` is what we render inside `<kbd>` tags next to commands
 * that bind to `metaKey || ctrlKey` — ⌘ on Mac, Ctrl elsewhere.
 * Detected once at module load; `navigator.platform` is deprecated
 * but still the only signal Safari ships, so we keep it as the
 * primary check.
 */

const platform =
  typeof navigator !== 'undefined' ? navigator.platform || '' : ''

export const isMac = /Mac|iPhone|iPad|iPod/.test(platform)

export const modKey = isMac ? '⌘' : 'Ctrl'
