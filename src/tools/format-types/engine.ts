/**
 * format.types — pure JSON → TypeScript inference engine.
 *
 * Dependency-free and side-effect-free so it can be unit-tested
 * without a DOM. `jsonToTypes` parses a JSON sample and emits a
 * TypeScript source string declaring an interface for every
 * distinct object shape it encounters.
 *
 * The walk runs in two passes held in one recursion:
 *
 *   1. `inferType` turns a parsed JSON value into an internal
 *      `TsType` node. Objects register a named interface (keyed by
 *      a PascalCased name derived from the property the object hangs
 *      off) and recurse into their properties.
 *   2. `emit` renders the collected interfaces. Output ordering is
 *      first-seen: the root interface is emitted last so that a
 *      reader scanning top-to-bottom meets leaf shapes before the
 *      shape that references them.
 *
 * Array element shapes are merged: every object in an array
 * contributes its keys to one shared interface, and a key missing
 * from any element becomes optional (`?`). Mixed-primitive arrays
 * collapse to a union of their element types. An empty array can't
 * be inferred and falls back to `unknown[]`.
 *
 * Names are made unique by suffixing a counter on collision so two
 * unrelated `config` objects don't clobber each other.
 */

export interface JsonToTypesOptions {
  /** Name of the top-level interface. Defaults to "Root". */
  rootName?: string
}

/** Internal representation of an inferred TypeScript type. */
type TsType =
  | { kind: 'primitive'; name: 'string' | 'number' | 'boolean' | 'null' }
  | { kind: 'unknown' }
  | { kind: 'ref'; name: string }
  | { kind: 'array'; element: TsType }
  | { kind: 'union'; members: TsType[] }

interface InterfaceDef {
  name: string
  /** Property order is first-seen across all merged elements. */
  props: Array<{ key: string; type: TsType; optional: boolean }>
}

/**
 * Convert a parsed JSON value (already `JSON.parse`d) into a
 * TypeScript source string. Throws on invalid JSON.
 */
export function jsonToTypes(
  jsonText: string,
  options: JsonToTypesOptions = {},
): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`)
  }

  const rootName = pascalCase(options.rootName ?? 'Root') || 'Root'

  // Collected interfaces in first-registered order, plus the name
  // registry used to keep generated names unique.
  const interfaces: InterfaceDef[] = []
  const used = new Set<string>()

  const reserve = (base: string): string => {
    const name = pascalCase(base) || 'T'
    if (!used.has(name)) {
      used.add(name)
      return name
    }
    let i = 2
    while (used.has(`${name}${i}`)) i++
    const unique = `${name}${i}`
    used.add(unique)
    return unique
  }

  /**
   * Infer the TsType of `value`. `nameHint` seeds the interface
   * name when `value` is an object (or an array of objects).
   */
  const inferType = (value: unknown, nameHint: string): TsType => {
    if (value === null) return { kind: 'primitive', name: 'null' }

    const t = typeof value
    if (t === 'string') return { kind: 'primitive', name: 'string' }
    if (t === 'number') return { kind: 'primitive', name: 'number' }
    if (t === 'boolean') return { kind: 'primitive', name: 'boolean' }

    if (Array.isArray(value)) {
      return { kind: 'array', element: inferArray(value, nameHint) }
    }

    if (t === 'object') {
      return inferObject(value as Record<string, unknown>, nameHint)
    }

    // undefined / function / symbol can't appear in JSON, but keep
    // the type total.
    return { kind: 'unknown' }
  }

  /** Infer the element type of an array, merging object shapes. */
  const inferArray = (arr: unknown[], nameHint: string): TsType => {
    if (arr.length === 0) return { kind: 'unknown' }

    const elementName = singularize(nameHint)
    const objects = arr.filter(
      (x) => x !== null && typeof x === 'object' && !Array.isArray(x),
    ) as Array<Record<string, unknown>>

    // When every element is a plain object, merge them into one
    // interface so differing keys become optional props.
    if (objects.length === arr.length) {
      return inferMergedObjects(objects, elementName)
    }

    // Otherwise build a union of the distinct element types.
    const members: TsType[] = []
    for (const item of arr) {
      pushUnique(members, inferType(item, elementName))
    }
    return members.length === 1 ? members[0]! : { kind: 'union', members }
  }

  const inferObject = (
    obj: Record<string, unknown>,
    nameHint: string,
  ): TsType => inferMergedObjects([obj], nameHint)

  /**
   * Merge one or more object samples into a single interface.
   * Keys are first-seen ordered; a key absent from any sample is
   * optional, and a key whose values differ across samples gets a
   * union type.
   */
  const inferMergedObjects = (
    objects: Array<Record<string, unknown>>,
    nameHint: string,
  ): TsType => {
    const name = reserve(nameHint)
    const def: InterfaceDef = { name, props: [] }
    // Register before recursing so self-referential shapes resolve.
    interfaces.push(def)

    const order: string[] = []
    const seen = new Set<string>()
    for (const obj of objects) {
      for (const key of Object.keys(obj)) {
        if (!seen.has(key)) {
          seen.add(key)
          order.push(key)
        }
      }
    }

    for (const key of order) {
      const members: TsType[] = []
      let presentEverywhere = true
      for (const obj of objects) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
          presentEverywhere = false
          continue
        }
        pushUnique(members, inferType(obj[key], key))
      }
      const type: TsType =
        members.length === 1 ? members[0]! : { kind: 'union', members }
      def.props.push({ key, type, optional: !presentEverywhere })
    }

    return { kind: 'ref', name }
  }

  const rootType = inferType(parsed, rootName)

  // If the root wasn't an object/array-of-objects there's no
  // interface to anchor; declare a type alias instead.
  const rootIsInterface =
    rootType.kind === 'ref' && interfaces.some((d) => d.name === rootType.name)

  const blocks: string[] = []
  // Emit nested interfaces first (excluding the root), root last.
  for (const def of interfaces) {
    if (rootIsInterface && def.name === (rootType as { name: string }).name) {
      continue
    }
    blocks.push(emitInterface(def))
  }
  if (rootIsInterface) {
    const rootDef = interfaces.find(
      (d) => d.name === (rootType as { name: string }).name,
    )!
    blocks.push(emitInterface(rootDef))
  } else {
    blocks.push(`export type ${rootName} = ${render(rootType)}`)
  }

  return blocks.join('\n\n') + '\n'
}

function emitInterface(def: InterfaceDef): string {
  const lines = [`export interface ${def.name} {`]
  for (const prop of def.props) {
    const safeKey = isSafeKey(prop.key) ? prop.key : JSON.stringify(prop.key)
    lines.push(`  ${safeKey}${prop.optional ? '?' : ''}: ${render(prop.type)}`)
  }
  lines.push('}')
  return lines.join('\n')
}

/** Render a TsType to its TypeScript source fragment. */
function render(type: TsType): string {
  switch (type.kind) {
    case 'primitive':
      return type.name
    case 'unknown':
      return 'unknown'
    case 'ref':
      return type.name
    case 'array': {
      const inner = render(type.element)
      // Parenthesise unions so `A | B[]` doesn't bind wrong.
      return type.element.kind === 'union' ? `(${inner})[]` : `${inner}[]`
    }
    case 'union':
      return dedupeUnion(type.members).map(render).join(' | ')
  }
}

/** Structural equality for union de-duplication. */
function sameType(a: TsType, b: TsType): boolean {
  return render(a) === render(b)
}

function pushUnique(members: TsType[], type: TsType): void {
  if (!members.some((m) => sameType(m, type))) members.push(type)
}

function dedupeUnion(members: TsType[]): TsType[] {
  const out: TsType[] = []
  for (const m of members) pushUnique(out, m)
  return out
}

/** A bare identifier needs no quoting as an interface key. */
function isSafeKey(key: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
}

/**
 * PascalCase a property name into a type name. Splits on
 * non-alphanumeric boundaries and camelCase humps, drops a leading
 * digit run, and falls back to the empty string when nothing
 * usable remains (caller substitutes a default).
 */
export function pascalCase(input: string): string {
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  return words
    .map((w) => w.replace(/^[0-9]+/, '')) // a leading digit run can't start a TS name
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

/**
 * Best-effort singularisation of a name so `users` → `User`.
 * Handles the common English suffixes; anything unrecognised is
 * returned unchanged.
 */
export function singularize(name: string): string {
  if (/ies$/i.test(name) && name.length > 3) {
    return name.slice(0, -3) + 'y' // categories → category
  }
  if (/(s|x|z|ch|sh)es$/i.test(name)) {
    return name.slice(0, -2) // boxes → box, dishes → dish
  }
  if (/ss$/i.test(name)) return name // address stays address
  if (/s$/i.test(name) && name.length > 1) return name.slice(0, -1) // users → user
  return name
}
