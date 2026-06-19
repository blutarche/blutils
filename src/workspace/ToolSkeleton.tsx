/**
 * ToolSkeleton — the Suspense fallback shown while a Tool's lazy
 * chunk loads.
 *
 * Tools have wildly different layouts (two-panel, single stamp,
 * centered image, explanation block…), so a fixed structural mock
 * would just guarantee a layout jump for most of them. Instead we
 * render only what is genuinely shared and already known from the
 * eager manifest — the real title and description that every Tool
 * head shows — plus a neutral, layout-agnostic loading bar. No
 * fake panels to mismatch the real interface.
 *
 * Prefetch-on-intent (see prefetchTool) means this fallback is
 * usually skipped entirely for sidebar / palette navigation — it
 * only surfaces on cold loads, slow networks, or direct URL hits.
 */

import type { ToolManifest } from '../types'

export function ToolSkeleton({ manifest }: { manifest: ToolManifest }) {
  return (
    <div class="tool-skel">
      {/* role=status is a polite live region; unlike aria-busy on the
       * container (which can suppress the announcement and never flips
       * back to false before this node unmounts), it announces the
       * loading message reliably. */}
      <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        loading {manifest.title}…
      </span>
      <div class="tool-head">
        <h1>{manifest.title}</h1>
        <span class="chip skel-chip">
          <span class="skel-spinner" /> loading
        </span>
      </div>
      <p class="tool-sub">{manifest.description}</p>

      <div class="skel-bar" role="presentation">
        <span class="skel-bar-fill" />
      </div>
    </div>
  )
}
