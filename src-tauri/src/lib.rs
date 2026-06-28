use std::sync::{Arc, Mutex};

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Emitter, Manager,
};

#[cfg(target_os = "macos")]
mod macos_drag;

/// Title-bar drag geometry reported by the frontend: the height of the
/// draggable band (matches the CSS `--header-h`, which shrinks under
/// compact density) and the rectangles of the interactive controls in it
/// (CSS px, viewport-relative). The native drag monitor reads both so it
/// drags the right band and never hijacks a button or the home brand.
pub struct DragState {
    pub band_height: f64,
    pub rects: Vec<[f64; 4]>,
}

/// Largest plausible number of interactive controls in the title bar.
const MAX_DRAG_RECTS: usize = 64;

pub type SharedDrag = Arc<Mutex<DragState>>;

/// Called from the frontend whenever the header layout changes. Inputs are
/// untrusted (any webview bug could send junk), so bound the vector and
/// drop non-finite values before they reach the per-click hit-test.
#[tauri::command]
fn set_drag_regions(band_height: f64, rects: Vec<[f64; 4]>, state: tauri::State<'_, SharedDrag>) {
    let rects: Vec<[f64; 4]> = rects
        .into_iter()
        .filter(|r| r.iter().all(|v| v.is_finite()))
        .take(MAX_DRAG_RECTS)
        .collect();
    let band_height = if band_height.is_finite() && band_height > 0.0 {
        band_height
    } else {
        46.0
    };
    if let Ok(mut guard) = state.lock() {
        guard.band_height = band_height;
        guard.rects = rects;
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let drag: SharedDrag = Arc::new(Mutex::new(DragState {
        band_height: 46.0,
        rects: Vec::new(),
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(drag.clone())
        .invoke_handler(tauri::generate_handler![set_drag_regions])
        .setup(move |app| {
            build_menu(app)?;
            register_global_shortcut(app)?;

            // Title bar style (Overlay) is set declaratively in
            // tauri.conf.json, letting the webview render under the title
            // bar so the traffic lights sit inside our sidebar header. That
            // also means WKWebView eats the drag clicks while focused, so we
            // drive window dragging natively instead (see macos_drag). We
            // deliberately skip NSVisualEffectView vibrancy here: on this
            // macOS version it renders invisibly yet still swallows events.
            #[cfg(target_os = "macos")]
            if let Some(window) = app.get_webview_window("main") {
                macos_drag::install_monitor(&window, drag.clone());
            }

            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().0.as_str();
            if let Some(window) = app.get_webview_window("main") {
                match id {
                    "palette" => {
                        let _ = window.emit("menu-action", "palette");
                    }
                    "tweaks" => {
                        let _ = window.emit("menu-action", "tweaks");
                    }
                    "chain" => {
                        let _ = window.emit("menu-action", "chain");
                    }
                    "home" => {
                        let _ = window.emit("menu-action", "home");
                    }
                    _ => {}
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn build_menu(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_menu = SubmenuBuilder::new(app, "blutils")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let go_palette = MenuItemBuilder::with_id("palette", "Command Palette")
        .accelerator("CmdOrCtrl+K")
        .build(app)?;
    let go_home = MenuItemBuilder::with_id("home", "Home")
        .accelerator("CmdOrCtrl+Shift+H")
        .build(app)?;
    let go_chain = MenuItemBuilder::with_id("chain", "Chain")
        .accelerator("CmdOrCtrl+Shift+C")
        .build(app)?;
    let go_tweaks = MenuItemBuilder::with_id("tweaks", "Tweaks")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;

    let go_menu = SubmenuBuilder::new(app, "Go")
        .item(&go_palette)
        .item(&go_home)
        .separator()
        .item(&go_chain)
        .item(&go_tweaks)
        .build()?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .separator()
        .close_window()
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&edit_menu)
        .item(&go_menu)
        .item(&window_menu)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

fn register_global_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    let app_handle = app.handle().clone();
    app.global_shortcut().on_shortcut("Alt+Space", move |_app, _shortcut, _event| {
        if let Some(window) = app_handle.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    })?;

    Ok(())
}
