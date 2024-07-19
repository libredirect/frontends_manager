use std::{ collections::HashMap, net::SocketAddr };

use bollard::{
    container::{ Config, CreateContainerOptions },
    image::CreateImageOptions,
    service::{ HostConfig, PortBinding, RestartPolicy, RestartPolicyNameEnum },
    Docker,
};
use futures_util::TryStreamExt;
use socket2::{ Domain, Protocol, Socket, Type };

use rand::Rng;

fn gen_config<'a>(
    frontend: &'a str,
    inner_port: &'a str,
    env: Option<Vec<&'a str>>
) -> Config<&'a str> {
    let restart_policy = Some(RestartPolicy {
        name: Some(RestartPolicyNameEnum::NO),
        maximum_retry_count: None,
    });
    let tty = Some(true);
    let host_port = random_port();
    Config {
        image: Some(get_from_image(frontend).from_image),
        tty,
        exposed_ports: Some(HashMap::from([(inner_port, HashMap::new())])),
        host_config: Some(HostConfig {
            port_bindings: Some(
                HashMap::from([
                    (
                        String::from(inner_port),
                        Some(
                            vec![PortBinding {
                                host_ip: Some(String::from("127.0.0.1")),
                                host_port: Some(host_port),
                                ..Default::default()
                            }]
                        ),
                    ),
                ])
            ),
            restart_policy,
            ..Default::default()
        }),
        env,
        ..Default::default()
    }
}

fn random_port() -> String {
    let mut rng = rand::thread_rng();
    let mut port: u32;
    loop {
        port = rng.gen_range(1024..65536);
        let socket = Socket::new(Domain::IPV4, Type::STREAM, Some(Protocol::TCP)).unwrap();
        let address_string = "127.0.0.1:".to_owned() + &port.to_string();
        let address: SocketAddr = address_string.parse().unwrap();
        if let Ok(_) = socket.bind(&address.into()) {
            break;
        }
    }
    port.to_string()
}

fn get_config<'a>(frontend: &'a str) -> Config<&'a str> {
    match frontend {
        "redlib" => gen_config(frontend, "8080", Some(vec!["REDLIB_DEFAULT_USE_HLS=on"])),
        "rimgo" =>
            gen_config(
                frontend,
                "3000",
                Some(
                    vec![
                        "FIBER_PREFORK=false",
                        "IMGUR_CLIENT_ID=546c25a59c58ad7",
                        "PRIVACY_CLOUDFLARE=false",
                        "PRIVACY_NOT_COLLECTED=false",
                        "PRIVACY_IP=false",
                        "PRIVACY_URL=false",
                        "PRIVACY_DEVICE=false",
                        "PRIVACY_DIAGNOSTICS=false"
                    ]
                )
            ),
        "anonymousoverflow" =>
            gen_config(
                frontend,
                "8080",
                Some(
                    vec![
                        "APP_URL=http://anonymousoverflow.localhost:8080",
                        "JWT_SIGNING_SECRET=secret"
                    ]
                )
            ),
        "simplytranslate" =>
            gen_config(
                frontend,
                "3000",
                Some(
                    vec![
                        "APP_URL=http://anonymousoverflow.localhost:8080",
                        "JWT_SIGNING_SECRET=secret",
                        "PORT=10046",
                        "HOST=127.0.0.1"
                    ]
                )
            ),
        "biblioreads" => gen_config(frontend, "3000", Some(vec!["NEXT_TELEMETRY_DISABLED=1"])),
        "libremdb" =>
            gen_config(
                frontend,
                "3000",
                Some(
                    vec![
                        "NEXT_PUBLIC_URL='http://libremdb.localhost:8080'",
                        "AXIOS_USERAGENT='Mozilla/5.0 (Windows NT 10.0; rv:112.0) Gecko/20100101 Firefox/112.0'",
                        "AXIOS_ACCEPT='text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'",
                        "NEXT_TELEMETRY_DISABLED=1",
                        "USE_REDIS=true",
                        "REDIS_URL=localhost:6379"
                    ]
                )
            ),
        "libmedium" => gen_config(frontend, "3000", None),
        "dumb" => gen_config(frontend, "3000", None),
        "gothub" =>
            gen_config(
                frontend,
                "3000",
                Some(
                    vec![
                        "GOTHUB_SETUP_COMPLETE=true",
                        "GOTHUB_IP_LOGGED=false",
                        "GOTHUB_REQUEST_URL_LOGGED=false",
                        "GOTHUB_USER_AGENT_LOGGED=false",
                        "GOTHUB_DIAGNOSTIC_INFO_LOGGED=false",
                        "GOTHUB_INSTANCE_PRIVACY_POLICY=",
                        "GOTHUB_INSTANCE_COUNTRY=",
                        "GOTHUB_INSTANCE_PROVIDER=",
                        "GOTHUB_INSTANCE_CLOUDFLARE=false",
                        "GOTHUB_PORT=10048"
                    ]
                )
            ),
        "neuters" => gen_config(frontend, "3000", None),
        _ =>
            Config {
                ..Default::default()
            },
    }
}

fn get_from_image(frontend: &str) -> CreateImageOptions<&str> {
    match frontend {
        "redlib" =>
            CreateImageOptions {
                from_image: "quay.io/redlib/redlib",
                tag: "latest",
                ..Default::default()
            },
        "rimgo" =>
            CreateImageOptions {
                from_image: "codeberg.org/rimgo/rimgo",
                ..Default::default()
            },
        "anonymousoverflow" =>
            CreateImageOptions {
                from_image: "ghcr.io/httpjamesm/anonymousoverflow:release",
                ..Default::default()
            },
        "biblioreads" =>
            CreateImageOptions {
                from_image: "nesaku/biblioreads",
                ..Default::default()
            },
        "libremdb" =>
            CreateImageOptions {
                from_image: "quay.io/pussthecatorg/libremdb",
                tag: "latest",
                ..Default::default()
            },

        "libmedium" =>
            CreateImageOptions {
                from_image: "realaravinth/libmedium",
                ..Default::default()
            },
        "gothub" =>
            CreateImageOptions {
                from_image: "codeberg.org/gothub/gothub:latest",
                ..Default::default()
            },

        _ => panic!("Frontend doesn't exist"),
    }
}

fn connect_docker() -> Docker {
    let socket_dir =
        String::from("unix://") +
        tauri::api::path::home_dir().unwrap().to_str().unwrap() +
        "/.docker/desktop/docker.sock";
    let docker = bollard::Docker
        ::connect_with_socket(&socket_dir, 12, bollard::API_DEFAULT_VERSION)
        .unwrap();
    docker
}

#[tauri::command]
pub fn docker_health() -> Result<bool, ()> {
    let socket_dir =
        String::from("unix://") +
        tauri::api::path::home_dir().unwrap().to_str().unwrap() +
        "/.docker/desktop/docker.sock";
    let docker_health = bollard::Docker
        ::connect_with_socket(&socket_dir, 12, bollard::API_DEFAULT_VERSION)
        .is_ok();
    Ok(docker_health)
}

#[tauri::command]
pub async fn download_frontend(frontend: &str) -> Result<String, ()> {
    println!("download_frontend({})", frontend);
    let docker = connect_docker();
    docker
        .create_image(Some(get_from_image(frontend)), None, None)
        .try_collect::<Vec<_>>().await
        .unwrap();
    configure_frontend(&docker, &frontend).await;
    Ok("downloaded".to_owned())
}

async fn configure_frontend(docker: &Docker, frontend: &str) -> String {
    println!("configure_frontend({})", frontend);
    docker
        .create_container(
            Some(CreateContainerOptions {
                name: frontend,
                platform: None,
            }),
            get_config(frontend)
        ).await
        .unwrap().id
}

#[tauri::command]
pub async fn run_frontend(frontend: &str) -> Result<String, ()> {
    println!("run_frontend({})", frontend);
    let docker = connect_docker();
    docker.start_container::<String>(frontend, None).await.unwrap();
    Ok("running".into())
}

#[tauri::command]
pub async fn stop_frontend(frontend: &str) -> Result<String, ()> {
    println!("stop_frontend({})", frontend);
    let docker = connect_docker();
    docker.stop_container(frontend, None).await.unwrap();
    Ok("downloaded".into())
}

#[tauri::command]
pub async fn get_port(frontend: &str) -> Result<String, ()> {
    let docker = connect_docker();
    let res = docker.inspect_container(frontend, None).await.unwrap();
    let exposed_ports = res.host_config.unwrap().port_bindings.unwrap();
    for (_, value) in exposed_ports {
        let port_bindings = value.unwrap();
        let host_port = port_bindings.first().unwrap().host_port.as_ref().unwrap();
        return Ok(host_port.to_owned());
    }
    Ok("".to_owned())
}

#[tauri::command]
pub async fn check_downloaded(frontend: &str) -> Result<String, ()> {
    println!("check_downloaded({})", frontend);
    let docker = connect_docker();
    if let Err(_) = docker.image_history(get_from_image(frontend).from_image).await {
        return Ok("not_downloaded".into());
    }
    if let Ok(inspect_response) = docker.inspect_container(frontend, None).await {
        if let Some(state) = inspect_response.state {
            if let Some(health) = state.status {
                if health == bollard::secret::ContainerStateStatusEnum::RUNNING {
                    return Ok("running".into());
                }
                return Ok("downloaded".into());
            }
        }
    }
    Ok("not_downloaded".into())
}

#[tauri::command]
pub async fn remove_frontend(frontend: &str) -> Result<String, ()> {
    let docker = connect_docker();
    docker.remove_container(frontend, None).await.unwrap();
    docker.remove_image(get_from_image(frontend).from_image, None, None).await.unwrap();
    Ok("not_downloaded".into())
}

#[tauri::command]
pub async fn frontends_json() -> Result<String, ()> {
    let str = include_str!("frontends.json");
    Ok(str.to_owned())
}
