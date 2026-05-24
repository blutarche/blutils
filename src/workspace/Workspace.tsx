/**
 * Workspace — the main content container.
 *
 * Holds the active view inside a scrollable inner pane with the
 * design's thin scrollbar and 28/36/56 padding. The container
 * itself never scrolls; only `.main-inner` does, so future
 * sticky bars (Tabs Bar, Chain toolbar) can pin against the top
 * of `.main` without fighting an outer scroll context.
 */

import type { ComponentChildren } from 'preact'

export function Workspace({
  children,
  flush = false,
}: {
  children: ComponentChildren
  flush?: boolean
}) {
  return (
    <section class="main" aria-label="Workspace">
      {flush ? children : <div class="main-inner">{children}</div>}
    </section>
  )
}
