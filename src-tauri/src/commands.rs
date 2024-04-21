use flate2::read::GzDecoder;
use zip_next::ZipArchive;

use std::fs::{self, remove_dir_all, File};

use std::process::{Child, Command};
use std::{env, fs::set_permissions, io::Write, os::unix::fs::PermissionsExt, path::Path};
use tar::Archive;

fn save_file(url: String, file_name: &std::path::PathBuf) {
    let mut body = ureq::get(&url).call().unwrap().into_reader();
    let mut file = std::fs::File::create(file_name).unwrap();
    std::io::copy(&mut body, &mut file).unwrap();
}

fn download_frontend_general(app_handle: tauri::AppHandle, frontend: String) -> String {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let dir = Path::new(binding.to_str().unwrap());
    if env::consts::OS == "linux" {
        let filename = frontend + "_linux_x86_64.tar.gz";
        let filename_path = dir.join(&filename);
        save_file(
            "https://github.com/libredirect/frontends_binaries/raw/main/binaries/".to_string()
                + &filename,
            &filename_path,
        );
        let tar = GzDecoder::new(File::open(&filename_path).unwrap());
        let mut archive = Archive::new(tar);
        archive.unpack(dir).unwrap();
        fs::remove_file(&filename_path).unwrap();
        return "downloaded".into();
    } else if env::consts::OS == "windows" {
        let filename = frontend + "_windows_x86_64.zip";
        let filename_path = dir.join(&filename);
        save_file(
            "https://github.com/libredirect/frontends_binaries/raw/main/binaries/".to_string()
                + &filename,
            &filename_path,
        );
        let zip = fs::File::open(&filename_path).unwrap();
        let mut archive = ZipArchive::new(zip).unwrap();
        archive.extract(dir).unwrap();
        fs::remove_file(&filename_path).unwrap();
        return "downloaded".into();
    }
    "not_downloaded".into()
}

fn run_frontend_general(
    app_handle: tauri::AppHandle,
    frontend: &str,
    command: &str,
    args: &[&str],
    envs: &[(&str, &str)],
) -> String {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let mut output = Command::new(command);
    output.current_dir(Path::new(binding.to_str().unwrap()).join(&frontend));
    if !args.is_empty() {
        output.args(args);
    }
    if !envs.is_empty() {
        output.envs(envs.to_vec());
    }
    let child = output.spawn();
    if !child.is_ok() {
        return "downloaded".into();
    }
    unsafe { FRONTENDS_PROCESSES.push((frontend.to_string(), child.unwrap())) };
    "running".into()
}

static mut FRONTENDS_PROCESSES: Vec<(String, Child)> = vec![];

fn write_caddyfile(app_handle: &tauri::AppHandle) {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let caddy_dir = Path::new(binding.to_str().unwrap()).join("caddy");
    let mut caddyfile = std::fs::File::create(caddy_dir.join("Caddyfile")).unwrap();
    caddyfile
        .write_all(include_str!("Caddyfile").as_bytes())
        .unwrap();
}

#[tauri::command]
pub async fn download_frontend(app_handle: tauri::AppHandle, frontend: &str) -> Result<String, ()> {
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
            write_caddyfile(&app_handle);
            Ok("downloaded".into())
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
                let tar = GzDecoder::new(File::open(&filename).unwrap());
                let mut archive = Archive::new(tar);
                archive.unpack(dir).unwrap();
                return Ok("downloaded".into());
            } else if env::consts::OS == "windows" {
                let filename = dir.join("rimgo-windows-amd64.zip");
                save_file(
                    "https://codeberg.org/rimgo/rimgo/releases/download/latest/rimgo-windows-amd64.zip"
                        .to_string(),
                    &filename,
                );
                let zipfile = fs::File::open(&filename).unwrap();
                let mut archive = zip_next::ZipArchive::new(zipfile).unwrap();
                archive.extract(dir).unwrap();
                return Ok("downloaded".into());
            }
            Ok("not_downloaded".into())
        }
        frontend => Ok(download_frontend_general(app_handle, frontend.to_string())),
    }
}

#[tauri::command]
pub async fn run_frontend(app_handle: tauri::AppHandle, frontend: &str) -> Result<String, ()> {
    if env::consts::OS == "linux" || env::consts::OS == "windows" {
        match frontend {
            "caddy" => {
                write_caddyfile(&app_handle);
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./caddy_linux_amd64"
                    } else {
                        "\\.caddy_windows_amd64.exe"
                    },
                    &["run"],
                    &[],
                ));
            }
            "redlib" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./redlib_linux_x86_64"
                    } else {
                        "\\.redlib_windows_x86_64.exe"
                    },
                    &["-p", "10041"],
                    &[("REDLIB_DEFAULT_USE_HLS", "on")],
                ))
            }
            "rimgo" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./rimgo"
                    } else {
                        "\\.rimgo.exe"
                    },
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
                ))
            }
            "anonymousoverflow" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./anonymousoverflow_linux_x86_64"
                    } else {
                        "\\.anonymousoverflow_windows_x86_64.exe"
                    },
                    &[],
                    &[
                        ("APP_URL", "http://anonymousoverflow.localhost:8080"),
                        ("JWT_SIGNING_SECRET", "secret"),
                        ("PORT", "10046"),
                        ("HOST", "127.0.0.1"),
                    ],
                ))
            }
            "simplytranslate" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./simplytranslate_linux_x86_64"
                    } else {
                        "\\.simplytranslate_windows_x86_64.exe"
                    },
                    &[],
                    &[("ADDRESS", "127.0.0.1:10044")],
                ))
            }
            "dumb" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./dumb_linux_x86_64"
                    } else {
                        "\\.dumb_windows_x86_64.exe"
                    },
                    &[],
                    &[("PORT", "10047")],
                ))
            }
            "gothub" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./gothub_linux_x86_64"
                    } else {
                        "\\.gothub_windows_x86_64.exe"
                    },
                    &["serve"],
                    &[
                        ("GOTHUB_SETUP_COMPLETE", "true"),
                        ("GOTHUB_IP_LOGGED", "false"),
                        ("GOTHUB_REQUEST_URL_LOGGED", "false"),
                        ("GOTHUB_USER_AGENT_LOGGED", "false"),
                        ("GOTHUB_DIAGNOSTIC_INFO_LOGGED", "false"),
                        ("GOTHUB_INSTANCE_PRIVACY_POLICY", ""),
                        ("GOTHUB_INSTANCE_COUNTRY", ""),
                        ("GOTHUB_INSTANCE_PROVIDER", ""),
                        ("GOTHUB_INSTANCE_CLOUDFLARE", "false"),
                        ("GOTHUB_PORT", "10048"),
                    ],
                ))
            }
            "neuters" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./neuters_linux_x86_64"
                    } else {
                        "\\.neuters_windows_x86_64.exe"
                    },
                    &["--address", "127.0.0.1:10049"],
                    &[],
                ))
            }
            "libmedium" => {
                return Ok(run_frontend_general(
                    app_handle,
                    frontend,
                    if env::consts::OS == "linux" {
                        "./libmedium_linux_x86_64"
                    } else {
                        "\\.libmedium_windows_x86_64.exe"
                    },
                    &[],
                    &[("LIBMEDIUM", "config.toml")],
                ))
            }
            _ => {}
        }
        return Ok("downloaded".into());
    }
    Ok("not_downloaded".into())
}

#[tauri::command]
pub async fn stop_frontend(frontend: &str) -> Result<String, ()> {
    for (key, child) in unsafe { &mut FRONTENDS_PROCESSES } {
        if key == frontend {
            child.kill().unwrap();
            let index = unsafe { &FRONTENDS_PROCESSES }
                .iter()
                .position(|(key, _)| key == frontend)
                .unwrap();
            unsafe { &mut FRONTENDS_PROCESSES }.remove(index);
        }
    }
    Ok("downloaded".into())
}

#[tauri::command]
pub async fn stop_all(app_handle: tauri::AppHandle) {
    let mut frontends_json: Vec<String> = vec![];
    for (key, child) in unsafe { &mut FRONTENDS_PROCESSES } {
        child.kill().unwrap();
        if !frontends_json.contains(key) {
            frontends_json.push(key.to_string());
        }
    }
    let json = serde_json::to_string(&frontends_json).unwrap();
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let path = Path::new(binding.to_str().unwrap()).join("binary_frontends.json");
    let mut output = File::create(path).unwrap();
    write!(output, "{}", json).unwrap();
}

#[tauri::command]
pub async fn check_downloaded(app_handle: tauri::AppHandle, frontend: &str) -> Result<String, ()> {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let dir = Path::new(binding.to_str().unwrap()).join(frontend);
    if Path::new(&dir).exists() {
        for (key, _) in unsafe { &FRONTENDS_PROCESSES } {
            if key == frontend {
                return Ok("running".into());
            }
        }
        return Ok("downloaded".into());
    }
    return Ok("not_downloaded".into());
}

#[tauri::command]
pub async fn startup(app_handle: tauri::AppHandle) {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let path = Path::new(binding.to_str().unwrap()).join("binary_frontends.json");
    if Path::new(&path).exists() {
        let contents = fs::read_to_string(path).unwrap();
        let json: Vec<String> = serde_json::from_str(&contents).unwrap();
        for frontend in json {
            run_frontend(app_handle.clone(), &frontend).await.unwrap();
        }
    }
}

#[tauri::command]
pub async fn remove_frontend(app_handle: tauri::AppHandle, frontend: &str) -> Result<String, ()> {
    let binding = app_handle.path_resolver().app_local_data_dir().unwrap();
    let path = Path::new(binding.to_str().unwrap()).join(frontend);
    remove_dir_all(path).unwrap();
    Ok("not_downloaded".into())
}
