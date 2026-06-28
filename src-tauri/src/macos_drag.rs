//! Native window dragging for the inset title bar.
//!
//! With `titleBarStyle: Overlay` the webview renders *under* the native
//! title bar so the traffic lights can sit inside our sidebar header.
//! The catch: WKWebView swallows mouse events, so when the window is
//! focused Tauri's JS `data-tauri-drag-region` path can't start a drag
//! (the title bar only sees the click when the window is unfocused).
//!
//! We fix it natively: a local `NSEvent` monitor intercepts left mouse
//! downs *before* the webview, and when one lands in the title-bar band
//! — and not on a button or the traffic lights — calls
//! `performWindowDragWithEvent:` synchronously. That's the same native
//! path the system title bar uses, so it works regardless of focus.
//!
//! The frontend reports the band height (the CSS `--header-h`, which
//! shrinks under compact density) and the rectangles of the interactive
//! header controls (see `set_drag_regions`) so we drag the right band and
//! never hijack a button's click or the home brand.

use core::ptr::NonNull;

use objc2::rc::Retained;
use objc2_app_kit::{NSEvent, NSEventMask, NSWindow};

use crate::SharedDrag;

/// Left strip reserved for the native traffic lights; clicks there must
/// reach the buttons, so we never treat them as a drag. The traffic
/// lights sit at a fixed inset regardless of UI density.
const TRAFFIC_W: f64 = 70.0;

/// Install a local mouse-down monitor that drags the window when the
/// click falls inside the inset title bar. The returned monitor object
/// is leaked so it lives for the lifetime of the app (installed exactly
/// once, from `setup`, for the single main window).
pub fn install_monitor(window: &tauri::WebviewWindow, state: SharedDrag) {
    let ptr = match window.ns_window() {
        Ok(p) => p as *mut NSWindow,
        Err(_) => return,
    };
    let ns_window: Retained<NSWindow> = match unsafe { Retained::retain(ptr) } {
        Some(w) => w,
        None => return,
    };

    let block = block2::RcBlock::new(move |event: NonNull<NSEvent>| -> *mut NSEvent {
        let ev: &NSEvent = unsafe { event.as_ref() };

        // Local event monitors are delivered on the main thread; if that
        // ever isn't true, pass the event through untouched rather than
        // assume it (instead of `new_unchecked`).
        let Some(mtm) = objc2::MainThreadMarker::new() else {
            return event.as_ptr();
        };

        let belongs = ev
            .window(mtm)
            .as_ref()
            .map(|w| Retained::as_ptr(w) == Retained::as_ptr(&ns_window))
            .unwrap_or(false);

        if belongs {
            let loc = ev.locationInWindow();
            let height = ns_window.frame().size.height;
            let top_y = height - loc.y; // AppKit origin is bottom-left.
            let x = loc.x;

            // Band height and control rects come from the frontend. On a
            // poisoned lock, default to "on a control" so we never steal a
            // click — dragging failing closed is far better than swallowed
            // clicks.
            let (band, on_control) = match state.lock() {
                Ok(g) => {
                    let on = g.rects.iter().any(|r| {
                        x >= r[0] && x <= r[0] + r[2] && top_y >= r[1] && top_y <= r[1] + r[3]
                    });
                    (g.band_height, on)
                }
                Err(_) => (0.0, true),
            };

            if top_y >= 0.0 && top_y <= band && x >= TRAFFIC_W && !on_control {
                ns_window.performWindowDragWithEvent(ev);
                return core::ptr::null_mut(); // swallow: the drag owns it.
            }
        }

        // Not a drag — let the event continue to the webview.
        event.as_ptr()
    });

    unsafe {
        let monitor =
            NSEvent::addLocalMonitorForEventsMatchingMask_handler(NSEventMask::LeftMouseDown, &block);
        std::mem::forget(monitor);
    }
}
