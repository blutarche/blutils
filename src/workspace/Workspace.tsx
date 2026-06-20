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
  routeKey,
}: {
  children: ComponentChildren
  flush?: boolean
  /** Changes per route so the content reveal animation re-runs. */
  routeKey?: string
}) {
  return (
    <section class="main" id="main" tabIndex={-1} aria-label="Workspace">
      {flush ? (
        children
      ) : (
        <div class="main-inner">
          <div class="route-reveal" key={routeKey}>
            {children}
          </div>
        </div>
      )}
    </section>
  )
}
