/**
 * TweaksPanel — the in-app settings surface.
 *
 * A small floating panel anchored to the bottom-right of the
 * Workspace, opened from the StatusBar settings segment. Holds
 * the five Tweaks: theme (light/dark), density (compact/regular),
 * showAdvanced (reveals Header mode toggles), smartHints (enables
 * Palette detectors), and rememberInputs (mirrors Tool inputs to
 * localStorage so they survive a tab close — off by default).
 *
 * The panel closes on Esc, backdrop click, or the close button.
 * No drag-handle in this iteration — the prototype's draggable
 * panel was a prototype-only flourish.
 */

import { useEffect } from 'preact/hooks'
import { useTweaks } from './tweaks-context'
import { Icon } from '../icons/Icon'
import type { DensityName, ThemeName, Tweaks } from '../types'

export interface TweaksPanelProps {
  open: boolean
  onClose: () => void
}

export function TweaksPanel({ open, onClose }: TweaksPanelProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div class="tweaks-backdrop" onClick={onClose} />
      <div class="tweaks-panel" role="dialog" aria-label="Tweaks">
        <div class="tweaks-head">
          <span class="title">tweaks</span>
          <button class="tweaks-close" type="button" aria-label="Close" onClick={onClose}>
            <Icon name="X" size={12} />
          </button>
        </div>
        <div class="tweaks-body">
          <ThemeRow />
          <DensityRow />
          <ToggleRow
            tweakKey="showAdvanced"
            label="show advanced"
            desc="reveals tab and chain toggles in the header"
          />
          <ToggleRow
            tweakKey="smartHints"
            label="smart hints"
            desc="palette inspects the clipboard on open"
          />
          <ToggleRow
            tweakKey="rememberInputs"
            label="remember inputs"
            desc="keep tool inputs across tab close (otherwise this tab only)"
          />
        </div>
      </div>
    </>
  )
}

function ThemeRow() {
  const { tweaks, setTweak } = useTweaks()
  const options: ThemeName[] = ['dark', 'light']
  return (
    <div class="tweaks-row">
      <span class="label">theme</span>
      <div class="tweaks-radio-group" role="radiogroup" aria-label="Theme">
        {options.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={tweaks.theme === name}
            class={tweaks.theme === name ? 'on' : ''}
            onClick={() => setTweak('theme', name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

function DensityRow() {
  const { tweaks, setTweak } = useTweaks()
  const options: DensityName[] = ['regular', 'compact']
  return (
    <div class="tweaks-row">
      <span class="label">density</span>
      <div class="tweaks-radio-group" role="radiogroup" aria-label="Density">
        {options.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={tweaks.density === name}
            class={tweaks.density === name ? 'on' : ''}
            onClick={() => setTweak('density', name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

type BooleanTweakKey = {
  [K in keyof Tweaks]: Tweaks[K] extends boolean ? K : never
}[keyof Tweaks]

function ToggleRow({
  tweakKey,
  label,
  desc,
}: {
  tweakKey: BooleanTweakKey
  label: string
  desc: string
}) {
  const { tweaks, setTweak } = useTweaks()
  return (
    <label class="tweaks-toggle">
      <input
        type="checkbox"
        checked={tweaks[tweakKey]}
        onChange={(e) =>
          setTweak(tweakKey, (e.currentTarget as HTMLInputElement).checked)
        }
      />
      <span>
        {label}
        <span class="desc">{desc}</span>
      </span>
    </label>
  )
}
