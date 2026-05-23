/**
 * Tiny history-routes client router.
 *
 * Tracks `location.pathname`, listens for `popstate` so browser
 * back/forward work, and exposes a `<Link>` that pushes history
 * and updates state on click without a full reload.
 *
 * `<Link>` lets modifier-clicks (Cmd/Ctrl/Shift/Alt, middle
 * button) fall through to the browser's normal new-tab / save
 * behaviour. Same-pathname navigations are no-ops.
 *
 * Hand-rolled rather than pulling in wouter or react-router:
 * for ~50 URLs with a flat scheme the whole router fits in
 * one file with no dependency.
 */

import { createContext, type ComponentChildren, type JSX } from 'preact'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'preact/hooks'

interface RouterValue {
  pathname: string
  navigate: (path: string) => void
}

const RouterContext = createContext<RouterValue | null>(null)

export function RouterProvider({ children }: { children: ComponentChildren }) {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname,
  )

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((path: string) => {
    if (typeof window === 'undefined') return
    if (path === window.location.pathname) return
    window.history.pushState(null, '', path)
    setPathname(path)
  }, [])

  const value = useMemo<RouterValue>(
    () => ({ pathname, navigate }),
    [pathname, navigate],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext)
  if (!ctx) {
    throw new Error('useRouter must be used inside <RouterProvider>')
  }
  return ctx
}

type AnchorProps = JSX.HTMLAttributes<HTMLAnchorElement>

export interface LinkProps extends Omit<AnchorProps, 'href'> {
  href: string
  children: ComponentChildren
}

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter()

  const handleClick = (event: MouseEvent) => {
    if (typeof onClick === 'function') {
      ;(onClick as (e: MouseEvent) => void)(event)
    }
    if (event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    navigate(href)
  }

  return (
    <a href={href} onClick={handleClick as unknown as AnchorProps['onClick']} {...rest}>
      {children}
    </a>
  )
}
