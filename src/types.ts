/**
 * Core contracts shared across the catalog.
 *
 * The plugin-shaped Tool catalog (one folder per Tool under
 * src/tools/) hangs off the ToolManifest type below. Adding a new
 * Tool means writing a manifest, an optional detect.ts, an
 * optional ops.ts, and a lazy Tool.tsx — nothing in this file
 * needs to change.
 */

export type ThemeName = 'light' | 'dark'
export type DensityName = 'compact' | 'regular'

export type ToolStatus = 'stable' | 'beta' | 'experimental'

/**
 * Curated Category identifiers. The set is closed — adding a
 * Category is a deliberate edit here plus an entry in
 * src/categories.ts. Order in the Sidebar and Home grid comes
 * from the Category record, not from the union ordering.
 */
export type CategoryId =
  | 'format'
  | 'encode'
  | 'hash'
  | 'text'
  | 'time'
  | 'generate'
  | 'inspect'

export interface Category {
  id: CategoryId
  /** Display label, lowercase per the design. */
  name: string
  /** 0-based curated position used to sort sections. */
  order: number
}

export interface ToolManifest {
  /** Dot-case canonical identity, e.g. "format.json". */
  id: string
  category: CategoryId
  /** URL fragment under /<category>/, e.g. "json" → /format/json. */
  slug: string
  /** Display name shown in Sidebar, Palette, and Home cards. */
  name: string
  /** Breadcrumb / Tab / Tool head — dot-cased, e.g. "json.format". */
  title: string
  /** One-line description for cards, palette, and meta. */
  description: string
  /**
   * Icon name. Typed as a plain string here to avoid a circular
   * import on lucide-preact; the Icon component validates the
   * name at runtime and the build-time registry sweep catches
   * unknown names at compile time.
   */
  icon: string
  /** Search synonyms surfaced in palette fuzzy matching. */
  tags: string[]
  /** Prerendered HTML head metadata. */
  seo: {
    title: string
    description: string
  }
  /** Maturity gate. Missing means stable. */
  status?: ToolStatus
  /** Additional URLs that open this Tool with different initial state. */
  aliases?: ToolAlias[]
}

export interface ToolAlias {
  /** URL fragment under /<category>/, e.g. "json-minify". */
  slug: string
  /** State to seed the Tool with when opened via this alias. */
  initialState?: Record<string, unknown>
}

export interface DetectorMatch {
  /** 0..1. Highest match across all Detectors wins. */
  confidence: number
  /** One-line label shown in the Palette detect strip. */
  label: string
  /** Text to pre-seed the Tool with when opened from the strip. */
  initialInput?: string
}

/**
 * A per-Tool predicate that examines clipboard text on Palette
 * open. Returns null when the Tool doesn't claim the text.
 */
export type Detector = (text: string) => DetectorMatch | null

/**
 * A primitive composable transform, registered by a Tool via its
 * optional ops.ts. The Chain runner pipes the output of step N
 * into the input of step N+1.
 */
export interface Op {
  /** Dot-case identity, e.g. "b64.encode". */
  id: string
  /** Display label in the Chain step header. */
  label: string
  /** Icon name (see Icon notes above). */
  icon: string
  fn: (input: string) => string | Promise<string>
}

export interface Tweaks {
  theme: ThemeName
  density: DensityName
  /** Reveals Multi-Tab Mode and Chain Mode toggles in the Header. */
  showAdvanced: boolean
  /** Enables clipboard Detectors on Palette open. */
  smartHints: boolean
  /**
   * Promotes sessionStorage Tool inputs to localStorage so they
   * survive a tab close. Default off; see the storage notes in
   * src/storage/schema.ts.
   */
  rememberInputs: boolean
}
