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
import type { ComponentChildren } from 'preact'
import { Icon } from '../icons/Icon'
import { copyText } from '../clipboard/copy'
import type { IconName } from '../icons/icon-set'
import { readSlice, writeSlice } from '../storage/local'
import { readSession, writeSession } from '../storage/session'
import { chainSlice, type ChainStepRecord } from '../storage/schema'
import { allOps, getOp } from './ops-registry'
import { runChain, type ChainStepResult } from './runner'
import type { Op } from '../types'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const INPUT_KEY = 'chain.input'

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

/** Sortable wrapper that owns the single useSortable call per step.
 * Passes a pre-built drag-handle element into its render-prop child
 * so the handle can be placed anywhere inside without a second
 * useSortable call. */
function SortableStepWrap({
  stepId,
  children,
}: {
  stepId: string
  children: (dragHandle: ComponentChildren) => ComponentChildren
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: stepId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  // `attributes` (ARIA) belongs on the sortable item container.
  // `listeners` (pointer/keyboard events) belongs on the drag handle.
  const handle = (
    <span class="chain-drag-handle" {...listeners} title="drag to reorder">
      <Icon name="GripVertical" size={13} />
    </span>
  )

  return (
    // @ts-expect-error dnd-kit types `role` as `string`; Preact expects the
    // narrower AriaRole union. The values are always valid ARIA roles.
    <div ref={setNodeRef} style={style} class="chain-step-wrap" {...attributes}>
      {children(handle)}
    </div>
  )
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
  const [pickerQuery, setPickerQuery] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const runToken = useRef(0)

  useEffect(() => { setIsClient(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    writeSlice(chainSlice, { steps: chain })
  }, [chain])

  useEffect(() => {
    writeSession(INPUT_KEY, input)
  }, [input])

  useEffect(() => {
    const token = ++runToken.current
    const ops: Op[] = chain.slice(1).map((step) => {
      const op = getOp(step.opId)
      return (
        op ?? {
          id: step.opId,
          label: step.opId,
          icon: 'Hash',
          fn: () => { throw new Error(`unknown op "${step.opId}"`) },
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

  const closePicker = () => {
    setPicker(null)
    setPickerQuery('')
  }

  const addStep = (afterId: string, opId: string) => {
    setChain((prev) => {
      const idx = prev.findIndex((s) => s.id === afterId)
      const next = prev.slice()
      next.splice(idx + 1, 0, { id: genId(), opId })
      return next
    })
    closePicker()
  }

  const removeStep = (id: string) => {
    setChain((prev) => prev.filter((s) => s.id !== id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setChain((prev) => {
      const from = prev.findIndex((s) => s.id === String(active.id))
      const to = prev.findIndex((s) => s.id === String(over.id))
      if (from <= 0 || to <= 0) return prev // input step stays at 0
      return arrayMove(prev, from, to)
    })
  }

  const copyValue = (value: string, id: string) => {
    copyText(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  const renderStepContent = (
    step: ChainStepRecord,
    i: number,
    dragHandle: ComponentChildren,
  ) => {
    const isInput = step.opId === 'input'
    const op = isInput ? null : getOp(step.opId)
    const result: ChainStepResult | undefined = isInput ? undefined : results[i - 1]
    const isLast = i === chain.length - 1
    const stateClass = isInput
      ? 'is-input'
      : result?.ok && isLast
        ? 'is-output'
        : result && !result.ok && !result.pending
          ? 'is-error'
          : ''

    const q = pickerQuery.trim().toLowerCase()
    const filteredOps = q
      ? allOps.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q),
        )
      : allOps

    const addWidget =
      picker === step.id ? (
        <div class="chain-picker">
          <div class="chain-picker-h">
            <Icon name="Search" size={11} class="chain-picker-search-icon" />
            <input
              class="chain-picker-search"
              placeholder="filter ops…"
              value={pickerQuery}
              onInput={(e) =>
                setPickerQuery((e.target as HTMLInputElement).value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Escape') closePicker()
                if (e.key === 'Enter' && filteredOps[0]) {
                  addStep(step.id, filteredOps[0].id)
                }
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <button
              class="btn ghost sm"
              aria-label="close picker"
              onClick={closePicker}
            >
              <Icon name="X" size={11} />
            </button>
          </div>
          <div class="chain-picker-b">
            {filteredOps.length > 0 ? (
              filteredOps.map((o) => (
                <button
                  key={o.id}
                  class="btn sm"
                  onClick={() => addStep(step.id, o.id)}
                >
                  <Icon name={o.icon as IconName} size={11} /> {o.label}
                </button>
              ))
            ) : (
              <span class="chain-picker-empty">no ops match</span>
            )}
          </div>
        </div>
      ) : (
        <button class="chain-add" onClick={() => setPicker(step.id)}>
          <Icon name="Plus" size={11} /> add step
        </button>
      )

    const copyTarget = isInput
      ? input
      : result?.ok
        ? (result.value ?? '')
        : result && !result.ok && !result.pending
          ? (result.error ?? '')
          : null

    return (
      <>
        <div class={`chain-step ${stateClass}`}>
          <div class="chain-step-h">
            {!isInput && dragHandle}
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
              <span class="chip bad">error</span>
            )}
            {result?.pending && <span class="chip">skipped</span>}
            {copyTarget !== null && (
              <button
                class="btn ghost sm"
                aria-label={copiedId === step.id ? 'copied' : 'copy'}
                style={copiedId === step.id ? { color: 'var(--ok)' } : undefined}
                onClick={() => copyValue(copyTarget, step.id)}
              >
                <Icon name={copiedId === step.id ? 'Check' : 'Copy'} size={11} />
              </button>
            )}
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
        {addWidget}
      </>
    )
  }

  const stepsEl = chain.map((step, i) => {
    const isInput = step.opId === 'input'

    if (isInput || !isClient) {
      return (
        <div key={step.id} class="chain-step-wrap">
          {renderStepContent(step, i, null)}
        </div>
      )
    }

    return (
      <SortableStepWrap key={step.id} stepId={step.id}>
        {(handle) => renderStepContent(step, i, handle)}
      </SortableStepWrap>
    )
  })

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
          onClick={() => finalResult != null && copyValue(finalResult, 'final')}
          disabled={finalResult == null}
        >
          <Icon name={copiedId === 'final' ? 'Check' : 'Copy'} size={11} />
          {copiedId === 'final' ? 'copied!' : 'copy final'}
        </button>
      </div>

      <div class="chain-stage">
        {isClient ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chain.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {stepsEl}
            </SortableContext>
          </DndContext>
        ) : (
          stepsEl
        )}
      </div>
    </div>
  )
}
