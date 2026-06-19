/**
 * inspect.cidr — IPv4 subnet (CIDR) calculator.
 *
 * Single input ("a.b.c.d/n", or a bare IP treated as /32) feeds
 * the pure `parseCidr` engine on every keystroke. A valid parse
 * fills a copyable .kv grid of every derived field — network,
 * broadcast, masks, host range, counts, private/public; an invalid
 * parse swaps the ok chip for a bad chip and shows the engine's
 * error inline.
 *
 * Each value row has a copy button so individual fields (a netmask,
 * a broadcast address) can be lifted out without selecting text.
 * The input persists via useToolInput so a reload keeps the block.
 */

import { useMemo } from 'preact/hooks'
import type { ToolProps } from '../../types'
import { Icon } from '../../icons/Icon'
import { useToolInput } from '../../storage/use-tool-input'
import { parseCidr } from './engine'

const SAMPLE = '192.168.1.10/24'

export default function Tool({ initialState }: ToolProps) {
  const seed =
    typeof initialState?.input === 'string' ? initialState.input : SAMPLE
  const [input, setInput] = useToolInput('inspect.cidr', seed)

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: parseCidr(input) }
    } catch (err) {
      return { ok: false as const, error: (err as Error).message }
    }
  }, [input])

  const copy = (s: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(s).catch(() => {})
    }
  }

  const rows: Array<{ label: string; value: string }> = parsed.ok
    ? [
        { label: 'network', value: parsed.value.network },
        { label: 'broadcast', value: parsed.value.broadcast },
        {
          label: 'netmask',
          value: `${parsed.value.netmask} /${parsed.value.prefix}`,
        },
        { label: 'wildcard', value: parsed.value.wildcard },
        { label: 'first host', value: parsed.value.firstHost },
        { label: 'last host', value: parsed.value.lastHost },
        {
          label: 'total',
          value: String(parsed.value.totalAddresses),
        },
        { label: 'usable hosts', value: String(parsed.value.usableHosts) },
      ]
    : []

  return (
    <>
      <div class="tool-head">
        <h1>ip.cidr</h1>
        {parsed.ok ? (
          <span class="chip ok">
            <Icon name="Check" size={11} /> valid
          </span>
        ) : (
          <span class="chip bad">
            <Icon name="X" size={11} /> invalid
          </span>
        )}
        {parsed.ok && (
          <span class="chip">
            {parsed.value.isPrivate ? 'private' : 'public'}
          </span>
        )}
      </div>
      <p class="tool-sub">
        IPv4 CIDR. Enter an address with a prefix; a bare IP is treated as /32.
      </p>

      <div class="panel" style={{ marginBottom: 14 }}>
        <div class="panel-h">
          <span>address / cidr</span>
          <span class="actions">
            <button class="btn ghost sm" type="button" onClick={() => setInput('')}>
              clear
            </button>
            <button class="btn ghost sm" type="button" onClick={() => setInput(SAMPLE)}>
              sample
            </button>
          </span>
        </div>
        <div class="panel-b">
          <input
            class="input"
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            spellcheck={false}
            placeholder="192.168.1.10/24"
          />
        </div>
      </div>

      <div class="panel">
        <div class="panel-h">
          <span>subnet</span>
        </div>
        <div class="panel-b">
          {parsed.ok ? (
            <dl class="kv" style={{ gridTemplateColumns: '110px 1fr auto' }}>
              {rows.map((r) => (
                <>
                  <dt key={`dt-${r.label}`}>{r.label}</dt>
                  <dd
                    key={`dd-${r.label}`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {r.value}
                  </dd>
                  <dd key={`cp-${r.label}`} style={{ textAlign: 'right' }}>
                    <button
                      class="btn ghost sm"
                      type="button"
                      onClick={() => copy(r.value)}
                    >
                      <Icon name="Copy" size={11} />
                    </button>
                  </dd>
                </>
              ))}
            </dl>
          ) : (
            <div class="json-error">{parsed.error}</div>
          )}
        </div>
      </div>
    </>
  )
}
