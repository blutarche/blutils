/**
 * Command Palette.
 *
 * Sections, top to bottom:
 *   - Detect strip — clipboard-driven hint shown only when the
 *     query is empty, the smartHints tweak is on, and a Detector
 *     claimed the clipboard text.
 *   - Tools — every registered Tool, filtered by fuzzy match
 *     against the manifest's name / title / id / tags.
 *   - Commands — built-in actions: Go home, Toggle theme / density,
 *     Open chain, Copy permalink, Clear all data.
 *
 * Ranking: with no query, items appear in catalog order with all
 * Tools above all Commands. With a query, every match is scored
 * by fuzzy.ts and the two pools are merged on score; Tools and
 * Commands re-section on render so the user still sees the split.
 *
 * Recent / Pinned sections arrive in Phase 5 and Phase 10 — slots
 * are intentionally absent until the data they need exists.
 */

import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { JSX } from 'preact'
import { Icon } from '../icons/Icon'
import { isIconName, type IconName } from '../icons/icon-set'
import { bestMatch, fuzzyMatch, type Range } from './fuzzy'
import {
  detectFromText,
  tools,
  toolById,
  type DetectionResult,
} from '../tools/_registry'
import { useRouter } from '../router/router'
import { useTweaks } from '../tweaks/tweaks-context'
import { clearAllLocal } from '../storage/local'
import { clearAllSession, writeSession } from '../storage/session'
import { inputSessionKey } from '../storage/inputs-mirror'
import type { ToolManifest } from '../types'

interface Command {
  id: string
  name: string
  desc?: string
  run: () => void
}

type ResultItem =
  | { kind: 'tool'; tool: ToolManifest; score: number; ranges: Range[] }
  | { kind: 'cmd'; cmd: Command; score: number; ranges: Range[] }

export function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { tweaks, setTweak } = useTweaks()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [detection, setDetection] = useState<DetectionResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Clipboard detection. The palette open is a user gesture, which
  // is enough for navigator.clipboard.readText() in most browsers.
  // Silently fall through on permission denial, an empty clipboard,
  // or a missing Clipboard API.
  useEffect(() => {
    if (!tweaks.smartHints) return
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return
    let cancelled = false
    navigator.clipboard
      .readText()
      .then((text) => {
        if (cancelled) return
        if (!text || text.length < 2) return
        const result = detectFromText(text)
        if (result) setDetection(result)
      })
      .catch(() => {
        // permission denied / focus issue / no clipboard text
      })
    return () => {
      cancelled = true
    }
  }, [tweaks.smartHints])

  const openDetection = (result: DetectionResult) => {
    const manifest = toolById.get(result.toolId)
    if (!manifest) return
    const seed = result.match.initialInput
    if (seed !== undefined) {
      // text.diff packs both halves into a JSON envelope; every
      // other Tool consumes a plain string for its primary input.
      if (result.toolId === 'text.diff') {
        try {
          const pair = JSON.parse(seed) as { a?: unknown; b?: unknown }
          if (typeof pair.a === 'string') writeSession(inputSessionKey('text.diff.a'), pair.a)
          if (typeof pair.b === 'string') writeSession(inputSessionKey('text.diff.b'), pair.b)
        } catch {
          // malformed envelope — drop the seed
        }
      } else {
        writeSession(inputSessionKey(result.toolId), seed)
      }
    }
    router.navigate(`/${manifest.category}/${manifest.slug}`)
    onClose()
  }

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'home',
        name: 'Go home',
        desc: 'return to the start screen',
        run: () => {
          router.navigate('/')
          onClose()
        },
      },
      {
        id: 'toggle-theme',
        name: 'Toggle theme',
        desc: tweaks.theme === 'dark' ? 'switch to light' : 'switch to dark',
        run: () => {
          setTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark')
        },
      },
      {
        id: 'toggle-density',
        name: 'Toggle density',
        desc:
          tweaks.density === 'regular'
            ? 'switch to compact'
            : 'switch to regular',
        run: () => {
          setTweak(
            'density',
            tweaks.density === 'regular' ? 'compact' : 'regular',
          )
        },
      },
      {
        id: 'open-chain',
        name: 'Open chain',
        desc: 'chain tools end to end',
        run: () => {
          router.navigate('/chain')
          onClose()
        },
      },
      {
        id: 'copy-permalink',
        name: 'Copy permalink',
        desc: 'copy this tool’s URL to the clipboard',
        run: () => {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).catch(() => {})
          }
          onClose()
        },
      },
      {
        id: 'clear-all-data',
        name: 'Clear all data',
        desc: 'wipe every blutils setting and reload',
        run: () => {
          if (typeof window === 'undefined') return
          const ok = window.confirm(
            'clear all blutils data? this cannot be undone.',
          )
          if (!ok) return
          clearAllLocal()
          clearAllSession()
          window.location.reload()
        },
      },
    ],
    [router, tweaks, setTweak, onClose],
  )

  const results = useMemo<ResultItem[]>(() => {
    const items: ResultItem[] = []

    for (const t of tools) {
      if (!q) {
        items.push({ kind: 'tool', tool: t, score: 0, ranges: [] })
        continue
      }
      const best = bestMatch([
        fuzzyMatch(q, t.name),
        fuzzyMatch(q, t.title),
        fuzzyMatch(q, t.id),
        ...t.tags.map((tag) => fuzzyMatch(q, tag)),
      ])
      if (best) {
        items.push({ kind: 'tool', tool: t, score: best.score, ranges: best.ranges })
      }
    }

    for (const c of commands) {
      if (!q) {
        items.push({ kind: 'cmd', cmd: c, score: 0, ranges: [] })
        continue
      }
      const m = fuzzyMatch(q, c.name)
      if (m) items.push({ kind: 'cmd', cmd: c, score: m.score, ranges: m.ranges })
    }

    if (q) items.sort((a, b) => b.score - a.score)
    return items
  }, [q, commands])

  useEffect(() => {
    setSel(0)
  }, [q])

  const choose = (item: ResultItem) => {
    if (item.kind === 'tool') {
      router.navigate(`/${item.tool.category}/${item.tool.slug}`)
      onClose()
    } else {
      item.cmd.run()
    }
  }

  const onKey = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSel((s) => Math.min(results.length - 1, s + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSel((s) => Math.max(0, s - 1))
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      // With no query, the Detect strip is the meaningful target —
      // Enter accepts it instead of the arbitrary first Tool that
      // happens to sort to the top of the alphabetised list.
      if (!q && detection) {
        openDetection(detection)
        return
      }
      const r = results[sel]
      if (r) choose(r)
    }
  }

  const toolResults = results.filter(
    (r): r is Extract<ResultItem, { kind: 'tool' }> => r.kind === 'tool',
  )
  const cmdResults = results.filter(
    (r): r is Extract<ResultItem, { kind: 'cmd' }> => r.kind === 'cmd',
  )

  return (
    <div class="palette-backdrop" onMouseDown={onClose}>
      <div
        class="palette"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div class="palette-input-row">
          <span class="palette-input-icon">
            <Icon name="Search" size={14} />
          </span>
          <input
            ref={inputRef}
            placeholder="Search tools or run a command…"
            value={q}
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
            onKeyDown={onKey}
            spellcheck={false}
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
          />
          <span class="kbd">esc</span>
        </div>
        {!q && detection && (
          <DetectStrip
            detection={detection}
            onOpen={() => openDetection(detection)}
          />
        )}
        <div class="palette-list">
          {results.length === 0 && <div class="palette-empty">no matches</div>}
          {toolResults.length > 0 && (
            <>
              <div class="pal-section">Tools</div>
              {toolResults.map((r) => {
                const i = results.indexOf(r)
                return (
                  <div
                    key={r.tool.id}
                    class={`pal-item ${i === sel ? 'on' : ''}`}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => choose(r)}
                  >
                    <span class="ic">
                      <Icon name={resolveIcon(r.tool.icon)} size={14} />
                    </span>
                    <span class="name">
                      <HiText text={r.tool.name} ranges={r.ranges} />
                    </span>
                    <span class="desc">{r.tool.description}</span>
                  </div>
                )
              })}
            </>
          )}
          {cmdResults.length > 0 && (
            <>
              <div class="pal-section">Commands</div>
              {cmdResults.map((r) => {
                const i = results.indexOf(r)
                return (
                  <div
                    key={r.cmd.id}
                    class={`pal-item ${i === sel ? 'on' : ''}`}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => choose(r)}
                  >
                    <span class="ic">
                      <Icon name="Settings" size={14} />
                    </span>
                    <span class="name">
                      <HiText text={r.cmd.name} ranges={r.ranges} />
                    </span>
                    {r.cmd.desc && <span class="desc">{r.cmd.desc}</span>}
                  </div>
                )
              })}
            </>
          )}
        </div>
        <div class="palette-foot">
          <span class="seg">
            <span class="kbd">↑↓</span> navigate
          </span>
          <span class="seg">
            <span class="kbd">↩</span> open
          </span>
          <span class="seg">
            <span class="kbd">esc</span> close
          </span>
          <span class="spacer" />
          <span>
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  )
}

function HiText({ text, ranges }: { text: string; ranges: Range[] }) {
  if (!ranges.length) return <>{text}</>
  const out: JSX.Element[] = []
  let cur = 0
  ranges.forEach(([a, b], i) => {
    if (a > cur) out.push(<span key={`p${i}`}>{text.slice(cur, a)}</span>)
    out.push(<mark key={`m${i}`}>{text.slice(a, b)}</mark>)
    cur = b
  })
  if (cur < text.length) out.push(<span key="t">{text.slice(cur)}</span>)
  return <>{out}</>
}

function resolveIcon(name: string): IconName {
  return isIconName(name) ? name : 'Braces'
}

function DetectStrip({
  detection,
  onOpen,
}: {
  detection: DetectionResult
  onOpen: () => void
}) {
  const manifest = toolById.get(detection.toolId)
  if (!manifest) return null
  return (
    <div class="palette-detect">
      <Icon name="Sparkles" size={12} />
      <span class="palette-detect-label">
        <b>Detected:</b> {detection.match.label}
      </span>
      <button type="button" class="btn sm primary" onClick={onOpen}>
        <span class="kbd">↩</span>
        open in {manifest.name.toLowerCase()}
      </button>
      <span class="palette-detect-from">from clipboard</span>
    </div>
  )
}
