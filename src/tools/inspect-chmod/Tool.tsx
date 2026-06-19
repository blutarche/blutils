/**
 * inspect.chmod — chmod calculator.
 *
 * A 3×3 checkbox grid (owner/group/other × read/write/execute) is
 * the single source of truth; the live octal and symbolic strings
 * are derived from it via the pure engine. Both strings are also
 * editable: typing a valid mode parses back into the grid, and a
 * bad entry flags `chip bad` without disturbing the toggles.
 *
 * Scope is standard 3-digit permissions — no setuid/setgid/sticky
 * (see engine.ts). Only the persisted state is the structured
 * Permissions, JSON-encoded via useToolInput.
 */

import { useMemo, useState } from 'preact/hooks'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import {
  type PermClass,
  type Permissions,
  parseOctal,
  parseSymbolic,
  toOctal,
  toSymbolic,
} from './engine'

const DEFAULT_OCTAL = '644'

const CLASSES: Array<{ key: keyof Permissions; label: string }> = [
  { key: 'owner', label: 'owner' },
  { key: 'group', label: 'group' },
  { key: 'other', label: 'other' },
]

const BITS: Array<{ key: keyof PermClass; label: string }> = [
  { key: 'r', label: 'read' },
  { key: 'w', label: 'write' },
  { key: 'x', label: 'exec' },
]

export default function Tool() {
  const [raw, setRaw] = useToolInput('inspect.chmod', DEFAULT_OCTAL)
  const [copied, setCopied] = useState<string | null>(null)

  // Persisted state is the canonical octal string; the grid and the
  // symbolic field both derive from it. A malformed persisted value
  // falls back to the default so the grid always has something valid.
  const perms = useMemo<Permissions>(() => {
    try {
      return parseOctal(raw)
    } catch {
      return parseOctal(DEFAULT_OCTAL)
    }
  }, [raw])

  const octal = toOctal(perms)
  const symbolic = toSymbolic(perms)

  // Manual-entry fields are kept separate from the canonical state so
  // an invalid keystroke can flag `chip bad` without resetting the grid.
  const [octalEntry, setOctalEntry] = useState(octal)
  const [symEntry, setSymEntry] = useState(symbolic)
  const [octalBad, setOctalBad] = useState(false)
  const [symBad, setSymBad] = useState(false)

  const commit = (next: Permissions) => {
    const o = toOctal(next)
    setRaw(o)
    setOctalEntry(o)
    setSymEntry(toSymbolic(next))
    setOctalBad(false)
    setSymBad(false)
  }

  const toggle = (cls: keyof Permissions, bit: keyof PermClass) => {
    commit({ ...perms, [cls]: { ...perms[cls], [bit]: !perms[cls][bit] } })
  }

  const onOctalInput = (value: string) => {
    setOctalEntry(value)
    try {
      commit(parseOctal(value))
    } catch {
      setOctalBad(true)
    }
  }

  const onSymInput = (value: string) => {
    setSymEntry(value)
    try {
      commit(parseSymbolic(value))
    } catch {
      setSymBad(true)
    }
  }

  const copy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 900)
    }
  }

  return (
    <>
      <div class="tool-head">
        <h1>unix.chmod</h1>
        <span class="chip">{octal}</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => commit(parseOctal(DEFAULT_OCTAL))}
        >
          <Icon name="RotateCw" size={11} /> reset
        </button>
      </div>
      <p class="tool-sub">
        Toggle the bits or type a mode. Octal and symbolic stay in sync. Nothing
        leaves your browser.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-b">
          <table style={{ borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th />
                {BITS.map((b) => (
                  <th
                    key={b.key}
                    style={{
                      padding: '4px 16px',
                      color: 'var(--muted)',
                      fontWeight: 400,
                    }}
                  >
                    {b.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((cls) => (
                <tr key={cls.key}>
                  <th
                    scope="row"
                    style={{
                      padding: '4px 16px 4px 0',
                      textAlign: 'left',
                      color: 'var(--muted)',
                      fontWeight: 400,
                    }}
                  >
                    {cls.label}
                  </th>
                  {BITS.map((b) => (
                    <td
                      key={b.key}
                      style={{ padding: '4px 16px', textAlign: 'center' }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`${cls.label} ${b.label}`}
                        checked={perms[cls.key][b.key]}
                        onChange={() => toggle(cls.key, b.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <div class="panel-h">
            <span>octal</span>
            <span class="actions">
              {octalBad && <span class="chip bad">invalid</span>}
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => copy(octal, 'octal')}
              >
                <Icon name={copied === 'octal' ? 'Check' : 'Copy'} size={11} /> copy
              </button>
            </span>
          </div>
          <div class="panel-b">
            <input
              class="input"
              type="text"
              inputMode="numeric"
              spellcheck={false}
              value={octalEntry}
              style={{ width: '100%' }}
              onInput={(e) => onOctalInput((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        <div class="panel">
          <div class="panel-h">
            <span>symbolic</span>
            <span class="actions">
              {symBad && <span class="chip bad">invalid</span>}
              <button
                class="btn ghost sm"
                type="button"
                onClick={() => copy(symbolic, 'sym')}
              >
                <Icon name={copied === 'sym' ? 'Check' : 'Copy'} size={11} /> copy
              </button>
            </span>
          </div>
          <div class="panel-b">
            <input
              class={'input' + (symBad ? ' bad' : '')}
              type="text"
              spellcheck={false}
              value={symEntry}
              style={{ width: '100%' }}
              onInput={(e) => onSymInput((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
      </div>
    </>
  )
}
