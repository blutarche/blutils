import { isDesktop } from './platform'

type MenuHandler = (action: string) => void

let handler: MenuHandler | null = null

export function setMenuHandler(fn: MenuHandler) {
  handler = fn
}

/**
 * Wire the web app to the Tauri desktop shell. Returns a cleanup function
 * so the caller's effect can tear everything down (relevant under dev HMR,
 * where the effect re-runs and would otherwise stack listeners).
 */
export function initTauriBridge(): () => void {
  if (!isDesktop) return () => {}

  document.documentElement.setAttribute('data-tauri', '')

  const disposers: Array<() => void> = []

  import('@tauri-apps/api/event').then(({ listen }) => {
    listen<string>('menu-action', (event) => {
      handler?.(event.payload)
    }).then((unlisten) => disposers.push(unlisten))
  })

  disposers.push(reportDragRegions())

  return () => {
    for (const dispose of disposers.splice(0)) dispose()
  }
}

/**
 * Report the title-bar drag geometry to the Rust side: the height of the
 * draggable band (the rendered `.header` height — it shrinks under compact
 * density) and the rectangles of the interactive controls within it. The
 * native drag monitor (src-tauri/src/macos_drag.rs) uses these to drag the
 * right band and never hijack a button's click or the home brand.
 * Re-reports on resize and whenever the header's contents change. Returns
 * a disposer that removes every observer and listener it set up.
 */
function reportDragRegions(): () => void {
  let raf = 0

  const send = () => {
    raf = 0
    const header = document.querySelector('.header')
    if (!header) return
    const bandHeight = header.getBoundingClientRect().height
    const rects: [number, number, number, number][] = []
    const push = (el: Element) => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        rects.push([r.left, r.top, r.width, r.height])
      }
    }
    // Interactive header controls (commands button, etc.) must keep their
    // clicks, and the brand is the clickable "go home" link — so none of
    // them should start a window drag.
    header
      .querySelectorAll('button, a, input, select, textarea, [role="button"]')
      .forEach(push)
    const brand = document.querySelector('.side-brand')
    if (brand) push(brand)
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('set_drag_regions', { bandHeight, rects }).catch(() => {})
    })
  }

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(send)
  }

  schedule()
  window.addEventListener('resize', schedule)

  const observers: Array<ResizeObserver | MutationObserver> = []
  const header = document.querySelector('.header')
  if (header) {
    const ro = new ResizeObserver(schedule)
    ro.observe(header)
    observers.push(ro)
    const mo = new MutationObserver(schedule)
    mo.observe(header, { childList: true, subtree: true })
    observers.push(mo)
  }

  return () => {
    if (raf) cancelAnimationFrame(raf)
    window.removeEventListener('resize', schedule)
    for (const o of observers) o.disconnect()
  }
}
