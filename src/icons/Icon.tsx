/**
 * Thin Lucide wrapper that pins blutils' stroke weight.
 *
 * The design uses a 1.4 px stroke globally — heavier than Lucide's
 * 2 px default. Setting it here means consumers never have to
 * remember; `<Icon name="Search" />` always renders at the right
 * weight.
 *
 * Names are constrained to the curated icon-set so unknown names
 * fail at compile time and bundle size stays controlled.
 */

import { iconSet, type IconName } from './icon-set'

export interface IconProps {
  name: IconName
  /** Pixel size of the icon square. Defaults to 14 — the design's typical inline icon size. */
  size?: number
  class?: string
  ariaLabel?: string
}

export function Icon({ name, size = 14, class: className, ariaLabel }: IconProps) {
  const Component = iconSet[name]
  return (
    <Component
      width={size}
      height={size}
      strokeWidth={1.4}
      class={className}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? 'img' : undefined}
    />
  )
}
