/**
 * Chain Mode view.
 *
 * Each step pipes the previous output into the next Op's input.
 * The runner re-executes on every chain or input change and halts
 * at the first thrown error. The leading `input` step is always
 * present and undeletable — it's the source of the pipeline.
 *
 * Layout persists to localStorage (`chain:v1`); the input string
 * persists to sessionStorage like every other Tool input, so chain
 * payloads never silently graduate to disk.
 */

import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/icon-set'
import { readSlice, writeSlice } from '../storage/local'
import { readSession, writeSession } from '../storage/session'
import { chainSlice, type ChainStepRecord } from '../storage/schema'
import { allOps, getOp } from './ops-registry'
import { runChain, type ChainStepResult } from './runner'
import type { Op } from '../types'

const INPUT_KEY = 'chain.input'

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

export function Chain() {
  const [chain, setChain] = useState<ChainStepRecord[]>(
    () => readSlice(chainSlice).steps,
  )
  const [input, setInput] = useState<string>(
    () => readSession(INPUT_KEY) ?? 'blutils ⚡',
  )
  const [results, setResults] = useState<ChainStepResult[]>([])
  const [picker, setPicker] = useState<string | null>(null)
  const runToken = useRef(0)

  // Persist chain layout on change.
  useEffect(() => {
    writeSlice(chainSlice, { steps: chain })
  }, [chain])

  // Persist input on change. sessionStorage only — no mirror.
  useEffect(() => {
    writeSession(INPUT_KEY, input)
  }, [input])

  // Re-run the chain whenever the shape or input changes.
  useEffect(() => {
    const token = ++runToken.current
    const ops: Op[] = chain.slice(1).map((step) => {
      const op = getOp(step.opId)
      return (
        op ?? {
          id: step.opId,
          label: step.opId,
          icon: 'Hash',
          fn: () => {
            throw new Error(`unknown op "${step.opId}"`)
          },
        }
      )
    })
    runChain(input, ops, () => token !== runToken.current).then((out) => {
      if (token === runToken.current) setResults(out)
    })
  }, [chain, input])

  const finalResult = useMemo(() => {
    for (let i = results.length - 1; i >= 0; i--) {
      const r = results[i]
      if (!r) continue
      if (r.ok) return r.value ?? ''
      if (!r.pending) return null
    }
    return null
  }, [results])

  const addStep = (afterId: string, opId: string) => {
    setChain((prev) => {
      const idx = prev.findIndex((s) => s.id === afterId)
      const next = prev.slice()
      next.splice(idx + 1, 0, { id: genId(), opId })
      return next
    })
    setPicker(null)
  }

  const removeStep = (id: string) => {
    setChain((prev) => prev.filter((s) => s.id !== id))
  }

  const copyFinal = () => {
    if (finalResult != null) {
      navigator.clipboard?.writeText(finalResult).catch(() => {})
    }
  }

  return (
    <div class="chain-view">
      <div class="chain-toolbar">
        <Icon name="GitMerge" size={14} />
        <span class="lbl">chain</span>
        <span class="muted">
          · {chain.length} step{chain.length === 1 ? '' : 's'} · auto-runs on
          every change
        </span>
        <span class="spacer" />
        <button
          class="btn sm"
          onClick={copyFinal}
          disabled={finalResult == null}
        >
          <Icon name="Copy" size={11} /> copy final
        </button>
      </div>

      <div class="chain-stage">
        {chain.map((step, i) => {
          const isInput = step.opId === 'input'
          const op = isInput ? null : getOp(step.opId)
          // Input step has no entry in `results`; step N's result is
          // results[N - 1] because results map to the non-input ops.
          const result = isInput ? null : results[i - 1]
          const isLast = i === chain.length - 1
          const stateClass = isInput
            ? 'is-input'
            : result?.ok && isLast
              ? 'is-output'
              : result && !result.ok && !result.pending
                ? 'is-error'
                : ''
          return (
            <div key={step.id} class="chain-step-wrap">
              <div class={`chain-step ${stateClass}`}>
                <div class="chain-step-h">
                  <span class="num">step {i + 1} /</span>
                  <Icon
                    name={(isInput ? 'Type' : (op?.icon ?? 'Hash')) as IconName}
                    size={13}
                  />
                  <span class="name">
                    {isInput ? 'input' : (op?.label ?? step.opId)}
                  </span>
                  <span class="spacer" />
                  {result?.ok && <span class="chip ok">ok</span>}
                  {result && !result.ok && !result.pending && (
                    <span class="chip bad">{result.error}</span>
                  )}
                  {result?.pending && <span class="chip">skipped</span>}
                  {!isInput && (
                    <button
                      class="btn ghost sm"
                      aria-label="remove step"
                      onClick={() => removeStep(step.id)}
                    >
                      <Icon name="X" size={11} />
                    </button>
                  )}
                </div>
                <div class="chain-step-b">
                  {isInput ? (
                    <textarea
                      class="area"
                      value={input}
                      onInput={(e) =>
                        setInput((e.target as HTMLTextAreaElement).value)
                      }
                      spellcheck={false}
                      rows={3}
                    />
                  ) : result?.ok ? (
                    <pre class="chain-out">
                      {result.value || <em class="muted">(empty)</em>}
                    </pre>
                  ) : result && !result.pending ? (
                    <pre class="chain-out chain-out-err">{result.error}</pre>
                  ) : (
                    <pre class="chain-out muted">…</pre>
                  )}
                </div>
              </div>

              {picker === step.id ? (
                <div class="chain-picker">
                  <div class="chain-picker-h">
                    <span class="name">add step after #{i + 1}</span>
                    <span class="spacer" />
                    <button
                      class="btn ghost sm"
                      aria-label="close picker"
                      onClick={() => setPicker(null)}
                    >
                      <Icon name="X" size={11} />
                    </button>
                  </div>
                  <div class="chain-picker-b">
                    {allOps.map((o) => (
                      <button
                        key={o.id}
                        class="btn sm"
                        onClick={() => addStep(step.id, o.id)}
                      >
                        <Icon name={o.icon as IconName} size={11} /> {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button class="chain-add" onClick={() => setPicker(step.id)}>
                  <Icon name="Plus" size={11} /> add step
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
