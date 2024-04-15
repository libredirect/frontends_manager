use flate2::read::GzDecoder;

use std::fs::{self, File};

use std::process::{Child, Command};
use std::{env, fs::set_permissions, io::Write, os::unix::fs::PermissionsExt, path::Path};
use tar::Archive;

fn save_file(url: String, file_name: &std::path::PathBuf) {
    println!("{}", url);
    let mut body = ureq::get(&url).call().unwrap().into_reader();
    let mut file = std::fs::File::create(file_name).unwrap();
    println!("{}", file_name.display());
    std::io::copy(&mut body, &mut file).unwrap();
}

fn download_frontend_general(app_handle: tauri::AppHandle, frontend: String) -> String {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let dir = Path::new(binding.to_str().unwrap());
    if env::consts::OS == "linux" {
        let filename = frontend + "_linux_x86_64.tar.gz";
        save_file(
            "https://github.com/libredirect/frontends_binaries/raw/main/binaries/".to_string()
                + &filename,
            &dir.join(&filename),
        );
        fs::remove_file(&dir.join(&filename)).unwrap();
        let tar_gz = File::open(&filename).unwrap();
        let tar = GzDecoder::new(tar_gz);
        let mut archive = Archive::new(tar);
        archive.unpack(dir).unwrap();
        return "downloaded".into();
    } else if env::consts::OS == "windows" {
        // let filename = frontend + "_windows_x86_64.zip";
    }
    "not_downloaded".into()
}

#[tauri::command]
pub fn download_frontend(app_handle: tauri::AppHandle, frontend: &str) -> String {
    match frontend {
        "caddy" => {
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
            "downloaded".into()
        }
        "rimgo" => {
            let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
            let dir = Path::new(binding.to_str().unwrap()).join("rimgo");
            std::fs::create_dir_all(&dir).unwrap();
            if env::consts::OS == "linux" {
                let filename = dir.join("rimgo-linux-amd64.tar.gz");
                save_file(
                    "https://codeberg.org/rimgo/rimgo/releases/download/latest/rimgo-linux-amd64.tar.gz"
                        .to_string(),
                    &filename,
                );
                let tar_gz = File::open(&filename).unwrap();
                let tar = GzDecoder::new(tar_gz);
                let mut archive = Archive::new(tar);
                archive.unpack(dir).unwrap();
                return "downloaded".into();
            } else if env::consts::OS == "windows" {
                save_file(
                    "https://codeberg.org/rimgo/rimgo/releases/download/latest/rimgo-windows-amd64.zip"
                        .to_string(),
                    &dir.join("rimgo-windows-amd64.zip"),
                );
                return "downloaded".into();
            }
            "not_downloaded".into()
        }
        frontend => download_frontend_general(app_handle, frontend.to_string()),
    }
}

#[tauri::command]
pub fn run_frontend(app_handle: tauri::AppHandle, frontend: &str) -> String {
    if env::consts::OS == "linux" {
        match frontend {
            "caddy" => {
                return run_frontend_general(
                    app_handle,
                    frontend,
                    "./caddy_linux_amd64",
                    &["run"],
                    &[],
                );
            }
            "libreddit" => {
                return run_frontend_general(
                    app_handle,
                    frontend,
                    "./libreddit_linux_x86_64",
                    &["-p", "10041"],
                    &[("REDLIB_DEFAULT_USE_HLS", "on")],
                )
            }
            "rimgo" => {
                return run_frontend_general(
                    app_handle,
                    frontend,
                    "./rimgo",
                    &[],
                    &[
                        ("ADDRESS", "127.0.0.1"),
                        ("PORT", "10042"),
                        ("FIBER_PREFORK", "false"),
                        ("IMGUR_CLIENT_ID", "546c25a59c58ad7"),
                        ("PRIVACY_CLOUDFLARE", "false"),
                        ("PRIVACY_NOT_COLLECTED", "false"),
                        ("PRIVACY_IP", "false"),
                        ("PRIVACY_URL", "false"),
                        ("PRIVACY_DEVICE", "false"),
                        ("PRIVACY_DIAGNOSTICS", "false"),
                    ],
                )
            }
            "anonymousoverflow" => {
                return run_frontend_general(
                    app_handle,
                    frontend,
                    "./anonymousoverflow_linux_x86_64",
                    &[],
                    &[
                        ("APP_URL", "http://anonymousoverflow.localhost:8080"),
                        ("JWT_SIGNING_SECRET", "secret"),
                        ("PORT", "10046"),
                        ("HOST", "127.0.0.1"),
                    ],
                )
            }
            "simplytranslate" => {
                return run_frontend_general(
                    app_handle,
                    frontend,
                    "./simplytranslate_linux_x86_64",
                    &[],
                    &[("ADDRESS", "127.0.0.1:10044")],
                )
            }
            "dumb" => {
                return run_frontend_general(
                    app_handle,
                    frontend,
                    "./dumb_linux_x86_64",
                    &[],
                    &[("PORT", "10047")],
                )
            }
            _ => {}
        }
    }
    "downloaded".into()
}

static mut FRONTENDS_PROCESSES: Vec<(String, Child)> = vec![];

fn run_frontend_general(
    app_handle: tauri::AppHandle,
    frontend: &str,
    command: &str,
    args: &[&str],
    envs: &[(&str, &str)],
) -> String {
    if env::consts::OS == "linux" {
        let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
        let mut output = Command::new(command);
        output.current_dir(Path::new(binding.to_str().unwrap()).join(&frontend));
        if !args.is_empty() {
            output.args(args);
        }
        if !envs.is_empty() {
            output.envs(envs.to_vec());
        }
        let child = output
            .spawn()
            .expect(&(frontend.to_string() + " failed to start"));

        unsafe { FRONTENDS_PROCESSES.push((frontend.to_string(), child)) };

        return "running".into();
    }
    "downloaded".into()
}

#[tauri::command]
pub fn stop_frontend(frontend: &str) -> String {
    for (key, child) in unsafe { &mut FRONTENDS_PROCESSES } {
        if key == frontend {
            println!("{}", key);
            child.kill().unwrap();
            let index = unsafe { &FRONTENDS_PROCESSES }
                .iter()
                .position(|(key, _)| key == frontend)
                .unwrap();
            unsafe { &mut FRONTENDS_PROCESSES }.remove(index);
        }
    }
    "downloaded".into()
}

#[tauri::command]
pub fn stop_all(app_handle: tauri::AppHandle) {
    let mut frontends_json: Vec<String> = vec![];
    for (key, child) in unsafe { &mut FRONTENDS_PROCESSES } {
        println!("{}", key);
        child.kill().unwrap();
        frontends_json.push(key.to_string());
    }
    let json = serde_json::to_string(&frontends_json).unwrap();
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let path = Path::new(binding.to_str().unwrap()).join("binary_frontends.json");
    let mut output = File::create(path).unwrap();
    write!(output, "{}", json).unwrap();
}

#[tauri::command]
pub fn check_downloaded(app_handle: tauri::AppHandle, frontend: &str) -> String {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let dir = Path::new(binding.to_str().unwrap()).join(frontend);
    if Path::new(&dir).exists() {
        for (key, _) in unsafe { &FRONTENDS_PROCESSES } {
            if key == frontend {
                return "running".into();
            }
        }
        return "downloaded".into();
    }
    return "not_downloaded".into();
}

#[tauri::command]
pub fn startup(app_handle: tauri::AppHandle) {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let path = Path::new(binding.to_str().unwrap()).join("binary_frontends.json");
    if Path::new(&path).exists() {
        let contents = fs::read_to_string(path).unwrap();
        let json: Vec<String> =
            serde_json::from_str(&contents).expect("JSON was not well-formatted");
        for frontend in json {
            run_frontend(app_handle.clone(), &frontend);
        }
    }
}
