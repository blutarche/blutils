/**
 * Preact JSX type augmentations.
 *
 * Preact's HTMLAttributes doesn't include `aria-roledescription`, which is a
 * valid ARIA attribute used by @dnd-kit/core's accessibility helpers.
 * Adding it here avoids type-cast workarounds at every dnd-kit usage site.
 */
declare namespace preact.JSX {
  interface HTMLAttributes {
    'aria-roledescription'?: string
    // dnd-kit spreads `role: string` onto sortable containers; Preact's
    // HTMLAttributes types it as the narrower `AriaRole` union which
    // makes the spread fail. Widening to string here is correct — all
    // AriaRole values are strings and dnd-kit only sets valid ARIA roles.
    role?: string
  }
}
