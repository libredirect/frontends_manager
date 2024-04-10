#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{env, fs::set_permissions, io::Write, os::unix::fs::PermissionsExt, path::Path};

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_autostart::MacosLauncher;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}))
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
            SystemTrayEvent::MenuItemClick { id, .. } => {
                let window = app.get_window("main").unwrap();
                match id.as_str() {
                    "show" => {
                        window.show().unwrap();
                    }
                    "hide" => {
                        window.hide().unwrap();
                    }
                    "quit" => {
                        window.emit_all("tray", "quit").unwrap();
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![download_caddy])
        .run(tauri::generate_context!())
        .unwrap();
}

fn save_file(url: String, file_name: &std::path::PathBuf) {
    println!("{}", url);
    let mut body = ureq::get(&url).call().unwrap().into_reader();
    let mut file = std::fs::File::create(file_name).unwrap();
    println!("{}", file_name.display());
    std::io::copy(&mut body, &mut file).unwrap();
}

#[tauri::command]
fn download_caddy(app_handle: tauri::AppHandle) -> String {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let caddy_dir = Path::new(binding.to_str().unwrap()).join("caddy");
    std::fs::create_dir_all(&caddy_dir).unwrap();
    if env::consts::OS == "linux" {
        let filename = caddy_dir.join("caddy_linux_amd64");
        save_file(
            "https://caddyserver.com/api/download?os=linux&arch=amd64".to_string(),
            &filename,
        );
        let mut perms = std::fs::metadata(&filename).unwrap().permissions();
        perms.set_mode(0o777);
        set_permissions(&filename, perms).unwrap();
    } else if env::consts::OS == "windows" {
        save_file(
            "https://caddyserver.com/api/download?os=windows&arch=amd64".to_string(),
            &caddy_dir.join("caddy_windows_amd64.exe"),
        );
    }
    let mut caddyfile = std::fs::File::create(caddy_dir.join("Caddyfile")).unwrap();
    caddyfile
        .write_all(include_str!("Caddyfile").as_bytes())
        .unwrap();
    "running".into()
}
