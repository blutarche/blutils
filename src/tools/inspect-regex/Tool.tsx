/**
 * inspect.regex — JavaScript-flavour regex tester.
 *
 * Compiles the pattern + flags on every change. Invalid patterns
 * surface as a bad chip + inline error block, valid ones replace
 * the chip with a `N matches` count.
 *
 * Test text panel shows the raw input as a textarea on top and the
 * live-highlighted render directly beneath, so you can see where
 * matches land in context. The right-hand panel lists every match
 * — index, value, and named-group breakdown via the .kv grid.
 *
 * Flag toggle is a segmented control over g/i/m/s/u/y; clicking a
 * letter toggles its presence in the flags string. The pattern,
 * flags, and test text all persist via useToolInput slices so the
 * page survives a reload.
 */

import { useMemo } from 'preact/hooks'
import type { JSX } from 'preact'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'

const FLAGS_ALL = ['g', 'i', 'm', 's', 'u', 'y'] as const
type Flag = (typeof FLAGS_ALL)[number]

const SAMPLE_TEXT = `Contact us:
  ada@blutils.dev  (primary)
  support+urgent@blutils.dev
  jane.doe@example.co.uk
  not-an-email
  bob_42@io.example
Server: 192.168.1.42 talking to 10.0.0.1
Reply by 2026-05-15.`

const SAMPLE_PATTERN = '(?<user>[\\w.+-]+)@(?<host>[\\w.-]+\\.[a-z]{2,})'

interface Match {
  index: number
  len: number
  value: string
  groups: Record<string, string | undefined>
}

export default function Tool() {
  const [pattern, setPattern] = useToolInput('inspect.regex.pattern', SAMPLE_PATTERN)
  const [flags, setFlags] = useToolInput('inspect.regex.flags', 'gi')
  const [text, setText] = useToolInput('inspect.regex.text', SAMPLE_TEXT)

  const compiled = useMemo(() => {
    try {
      return { re: new RegExp(pattern, flags), error: null as string | null }
    } catch (err) {
      return { re: null as RegExp | null, error: (err as Error).message }
    }
  }, [pattern, flags])

  const matches = useMemo<Match[]>(() => {
    if (!compiled.re) return []
    const re = compiled.re
    const out: Match[] = []
    if (re.global) {
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        out.push({
          index: m.index,
          len: m[0]!.length,
          value: m[0]!,
          groups: (m.groups as Record<string, string | undefined>) ?? {},
        })
        if (m.index === re.lastIndex) re.lastIndex++
      }
    } else {
      const m = re.exec(text)
      if (m) {
        out.push({
          index: m.index,
          len: m[0]!.length,
          value: m[0]!,
          groups: (m.groups as Record<string, string | undefined>) ?? {},
        })
      }
    }
    return out
  }, [compiled, text])

  const highlighted = useMemo<JSX.Element[]>(() => {
    if (!matches.length) return [<>{text}</>]
    const out: JSX.Element[] = []
    let cur = 0
    matches.forEach((m, i) => {
      if (m.index > cur) out.push(<span key={`t${i}`}>{text.slice(cur, m.index)}</span>)
      out.push(<mark key={`m${i}`} title={`match ${i + 1}`}>{m.value}</mark>)
      cur = m.index + m.len
    })
    if (cur < text.length) out.push(<span key="tail">{text.slice(cur)}</span>)
    return out
  }, [text, matches])

  const toggleFlag = (f: Flag) => {
    setFlags(flags.includes(f) ? flags.replace(f, '') : flags + f)
  }

  return (
    <>
      <div class="tool-head">
        <h1>regex.test</h1>
        {compiled.error ? (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        ) : (
          <span class="chip ok">
            {matches.length} match{matches.length === 1 ? '' : 'es'}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div class="seg-ctrl">
          {FLAGS_ALL.map((f) => (
            <button
              key={f}
              type="button"
              class={flags.includes(f) ? 'on' : ''}
              onClick={() => toggleFlag(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <p class="tool-sub">JavaScript flavour. Named groups and lookaround supported.</p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>pattern</span>
        </div>
        <div class="panel-b" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>/</span>
          <input
            class="input bare"
            value={pattern}
            onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
            spellcheck={false}
          />
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            /{flags}
          </span>
        </div>
        {compiled.error && (
          <div class="json-error" style={{ margin: '0 12px 12px' }}>
            {compiled.error}
          </div>
        )}
      </div>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>test text</span>
            <span class="actions">
              <button class="btn ghost sm" type="button" onClick={() => setText('')}>
                clear
              </button>
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => setText(SAMPLE_TEXT)}
              >
                sample
              </button>
            </span>
          </div>
          <div class="panel-b">
            <textarea
              class="area bare"
              style={{ minHeight: 200 }}
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              spellcheck={false}
            />
            <div
              class="regex-text"
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px dashed var(--line)',
              }}
            >
              {highlighted}
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-h">
            <span>matches · {matches.length}</span>
          </div>
          <div class="panel-b" style={{ maxHeight: 360, overflowY: 'auto' }}>
            {matches.length === 0 && (
              <div class="palette-empty" style={{ padding: 20 }}>
                no matches
              </div>
            )}
            {matches.map((m, i) => {
              const groupEntries = Object.entries(m.groups).filter(([, v]) => v !== undefined)
              return (
                <div
                  key={i}
                  style={{
                    padding: '8px 0',
                    borderTop: i ? '1px dashed var(--line)' : 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span class="chip" style={{ fontSize: 10 }}>
                      #{i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                      {m.value}
                    </span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      }}
                    >
                      @ {m.index}
                    </span>
                  </div>
                  {groupEntries.length > 0 && (
                    <dl
                      class="kv"
                      style={{
                        marginTop: 4,
                        marginLeft: 12,
                        gridTemplateColumns: '70px 1fr',
                      }}
                    >
                      {groupEntries.map(([k, v]) => (
                        <>
                          <dt key={`dt-${k}`}>{k}</dt>
                          <dd key={`dd-${k}`}>{v}</dd>
                        </>
                      ))}
                    </dl>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
