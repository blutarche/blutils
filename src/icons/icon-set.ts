/**
 * The curated icon set blutils renders.
 *
 * Importing lucide-preact via specific named exports (rather than
 * a namespace import) keeps tree-shaking honest — only the icons
 * listed here ship in the bundle. Adding a new icon is a one-line
 * addition to this map plus the import.
 *
 * The registry shape also gives us typed Manifest icons: any
 * string used as a Manifest's `icon` is validated against
 * `IconName` at the registry sweep (Phase 2).
 */

import {
  type FunctionalComponent,
  type ComponentProps,
} from 'preact'

// Lucide-preact icons accept these props at runtime.
type LucideIcon = FunctionalComponent<
  ComponentProps<'svg'> & { size?: number | string; strokeWidth?: number | string }
>

import {
  GitMerge,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-preact'

export const iconSet = {
  GitMerge,
  Plus,
  Search,
  Settings,
  X,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof iconSet

export function isIconName(value: string): value is IconName {
  return Object.prototype.hasOwnProperty.call(iconSet, value)
}
