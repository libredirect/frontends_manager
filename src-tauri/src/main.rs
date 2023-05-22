#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs_watch::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {}))
        .system_tray(
            SystemTray::new().with_menu(
                SystemTrayMenu::new()
                    .add_item(CustomMenuItem::new("show", "Show"))
                    .add_item(CustomMenuItem::new("hide", "Hide"))
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(CustomMenuItem::new("quit", "Quit")),
            ),
        )
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                "quit" => {
                    let window = app.get_window("main").unwrap();
                    window.emit_all("tray", "quit").unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
