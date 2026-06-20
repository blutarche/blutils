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
  ArrowLeftRight,
  Binary,
  Braces,
  Calculator,
  CaseSensitive,
  Check,
  ChevronDown,
  Clock,
  Code,
  Contrast,
  Copy,
  Dices,
  FileCode,
  FileDigit,
  FileText,
  GitMerge,
  Globe,
  GripVertical,
  Hash,
  IdCard,
  KeyRound,
  Link,
  Link2,
  List,
  ListTree,
  Lock,
  Menu,
  Minus,
  Network,
  Palette,
  Pause,
  Pin,
  PinOff,
  Play,
  Plus,
  QrCode,
  Regex,
  RotateCw,
  ScanLine,
  Search,
  Server,
  Settings,
  Sigma,
  Sparkles,
  TimerReset,
  Type,
  Unlink,
  X,
} from 'lucide-preact'

export const iconSet = {
  ArrowLeftRight,
  Binary,
  Braces,
  Calculator,
  CaseSensitive,
  Check,
  ChevronDown,
  Clock,
  Code,
  Contrast,
  Copy,
  Dices,
  FileCode,
  FileDigit,
  FileText,
  GitMerge,
  Globe,
  GripVertical,
  Hash,
  IdCard,
  KeyRound,
  Link,
  Link2,
  List,
  ListTree,
  Lock,
  Menu,
  Minus,
  Network,
  Palette,
  Pause,
  Pin,
  PinOff,
  Play,
  Plus,
  QrCode,
  Regex,
  RotateCw,
  ScanLine,
  Search,
  Server,
  Settings,
  Sigma,
  Sparkles,
  TimerReset,
  Type,
  Unlink,
  X,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof iconSet

export function isIconName(value: string): value is IconName {
  return Object.prototype.hasOwnProperty.call(iconSet, value)
}
