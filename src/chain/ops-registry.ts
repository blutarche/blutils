/**
 * Eager-glob registry of every Op contributed by every Tool.
 *
 * Tools register Ops by exporting `ops: Op[]` from
 * src/tools/<id>/ops.ts. The registry collects them at build
 * time, validates id uniqueness, and exposes lookup helpers used
 * by the Chain runner and picker UI.
 *
 * Ops are eager (small functions, no UI) — there is nothing to
 * lazy-load here. The whole catalog of Ops is part of the chain
 * route's chunk.
 */

import type { Op } from '../types'

interface OpsModule {
  ops?: Op[]
}

const modules = import.meta.glob<OpsModule>('../tools/*/ops.ts', { eager: true })

const collected: Op[] = []
const byId = new Map<string, Op>()

for (const [path, mod] of Object.entries(modules)) {
  const list = mod.ops
  if (!list) continue
  for (const op of list) {
    if (byId.has(op.id)) {
      throw new Error(
        `duplicate Op id "${op.id}" (second declaration at ${path})`,
      )
    }
    byId.set(op.id, op)
    collected.push(op)
  }
}

collected.sort((a, b) => a.id.localeCompare(b.id))

export const allOps: readonly Op[] = collected

export function getOp(id: string): Op | undefined {
  return byId.get(id)
}
