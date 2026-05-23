/**
 * `useSeededState` — `useState` with a re-seeded initial value.
 *
 * Plain useState ignores changes to its initial argument after
 * mount. That's the wrong semantics for alias-seeded Tool state:
 * navigating from `/format/json` to `/format/json-minify` should
 * flip the indent to 0 even though the Tool component is reused
 * across that navigation.
 *
 * This wrapper picks up the seed on every render where it changes
 * and resets state to it. User edits still take precedence within
 * a stable seed window.
 */

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type StateUpdater,
} from 'preact/hooks'

export function useSeededState<T>(seed: T): [T, Dispatch<StateUpdater<T>>] {
  const [state, setState] = useState<T>(seed)
  const lastSeed = useRef(seed)
  useEffect(() => {
    if (lastSeed.current !== seed) {
      lastSeed.current = seed
      setState(seed)
    }
  }, [seed])
  return [state, setState]
}
