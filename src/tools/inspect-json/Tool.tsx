/**
 * inspect.json — JSON tree viewer.
 *
 * A single input textarea feeds the pure `parseJson` + `buildNodes`
 * engine on every keystroke. A valid parse renders a collapsible
 * tree; an invalid parse swaps the ok chip for a bad chip and shows
 * the engine's error inline.
 *
 * Collapse state is a Set of collapsed container paths. The flat
 * node list from `buildNodes` is rendered by tracking the shallowest
 * currently-collapsed depth: any node deeper than that is hidden
 * until its ancestor expands. Expand-all clears the Set; collapse-all
 * fills it with every container path.
 *
 * Clicking a node copies its JSONPath. Input persists via
 * useToolInput so a reload keeps your payload.
 */

import { useMemo, useState } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { buildNodes, parseJson, type JsonValueType } from './engine'

const SAMPLE_JSON = `{"id":"u_8421","name":"Ada","tags":["beta","admin"],"meta":{"twoFA":true,"lastLogin":1747800000,"devices":[{"os":"macOS","ver":"15.4"},{"os":"iOS","ver":"18.4"}]}}`

const INDENT_PX = 16

export default function Tool({ initialState }: ToolProps) {
  const seed =
    typeof initialState?.input === 'string' ? initialState.input : ''
  const [input, setInput] = useToolInput('inspect.json', seed)

  const isEmpty = input.trim() === ''
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const parsed = useMemo(() => parseJson(input), [input])
  const nodes = useMemo(
    () => (parsed.ok ? buildNodes(parsed.value) : []),
    [parsed],
  )

  // Walk the flat list, skipping any node under a collapsed ancestor.
  // `hideBelow` holds the depth of the shallowest collapsed container
  // we're currently inside; anything strictly deeper is hidden.
  const visible = useMemo(() => {
    const rows: typeof nodes = []
    let hideBelow = Infinity
    for (const n of nodes) {
      if (n.depth <= hideBelow) {
        hideBelow = Infinity
        rows.push(n)
        if (n.collapsible && collapsed.has(n.path)) hideBelow = n.depth
      }
    }
    return rows
  }, [nodes, collapsed])

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () =>
    setCollapsed(new Set(nodes.filter((n) => n.collapsible).map((n) => n.path)))

  const copyPath = (path: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(path).catch(() => {})
    }
    setCopied(path)
    window.setTimeout(() => setCopied((c) => (c === path ? null : c)), 1000)
  }

  return (
    <>
      <div class="tool-head">
        <h1>json.tree</h1>
        <button type="button" class="btn ghost sm" onClick={() => setInput(SAMPLE_JSON)} title="Load sample" aria-label="Load sample"><Icon name="Sparkles" size={13} /></button>
        {!isEmpty && (parsed.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> valid
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" class="btn" onClick={expandAll} disabled={!parsed.ok}>
          <Icon name="Plus" size={11} /> expand all
        </button>
        <button type="button" class="btn" onClick={collapseAll} disabled={!parsed.ok}>
          <Icon name="Minus" size={11} /> collapse all
        </button>
      </div>
      <p class="tool-sub">
        Explore JSON as a collapsible tree. Click a node to copy its path. No
        data leaves your browser.
      </p>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>input</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
                clear
              </button>
            </span>
          </div>
          <textarea
            class="area bare"
            value={input}
            placeholder={'Paste JSON here…\n\ne.g. {"hello": "world"}'}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
            style={{ minHeight: 360 }}
          />
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>tree</span>
          </div>
          {isEmpty ? (
            <div class="tool-empty">JSON tree appears here.</div>
          ) : parsed.ok ? (
            <div
              class="panel-b"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                lineHeight: 1.7,
              }}
            >
              {visible.map((n) => {
                const isCollapsed = n.collapsible && collapsed.has(n.path)
                return (
                  <div
                    key={n.path}
                    onClick={() => copyPath(n.path)}
                    title={`copy ${n.path}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      paddingLeft: n.depth * INDENT_PX,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.collapsible ? (
                      <button
                        type="button"
                        class="btn ghost sm"
                        aria-label={isCollapsed ? 'expand' : 'collapse'}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggle(n.path)
                        }}
                        style={{
                          padding: 0,
                          width: 16,
                          height: 16,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 0,
                          background: 'transparent',
                          color: 'var(--muted)',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                            transition: 'transform 0.12s ease',
                          }}
                        >
                          <Icon name="ChevronDown" size={11} />
                        </span>
                      </button>
                    ) : (
                      <span style={{ width: 16, flex: '0 0 16px' }} />
                    )}
                    <span style={{ color: 'var(--ink-2)' }}>{n.key}</span>
                    <span style={{ color: 'var(--muted)' }}>:</span>
                    <span style={{ color: typeColor(n.type) }}>{n.preview}</span>
                    {copied === n.path && (
                      <span class="chip ok" style={{ marginLeft: 8 }}>
                        copied
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div class="panel-b">
              <div class="json-error">{parsed.error}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * A CSS variable for the preview color, reusing the same syntax
 * token palette as the JSON formatter so types read consistently
 * across both tools. Containers fall back to the muted ink.
 */
function typeColor(type: JsonValueType): string {
  switch (type) {
    case 'string':
      return 'var(--tok-string)'
    case 'number':
      return 'var(--tok-number)'
    case 'boolean':
      return 'var(--tok-bool)'
    case 'null':
      return 'var(--tok-keyword)'
    default:
      return 'var(--muted)'
  }
}
