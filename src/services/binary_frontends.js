const Twindow = window.__TAURI__.window
const invoke = window.__TAURI__.invoke

async function run_caddy() {
    let result = await check_downloaded('caddy')
    if (result == 'not_downloaded') {
        const caddy_donloading = new Twindow.WebviewWindow('refreshWindow',
            { url: 'message.html#Downloading Caddy', height: 200, width: 400, center: true },
        );
        result = await invoke('download_frontend', { frontend: 'caddy' })
        caddy_donloading.close()
    }
    return await invoke('run_frontend', { frontend: "caddy" });
}

async function run_frontend(name) {
    return await invoke('run_frontend', { frontend: name });
}

async function download_frontend(name) {
    return await invoke('download_frontend', { frontend: name })
}

async function check_downloaded(name) {
    return await invoke('check_downloaded', { frontend: name })
}

async function remove_frontend(name) {
    return await invoke('remove_frontend', { frontend: name })
}

async function stop_frontend(name) {
    return await invoke('stop_frontend', { frontend: name })
}

async function stop_all() {
    return await invoke('stop_all')
}

async function startup() {
    return await invoke('startup')
}

export default {
    run_caddy,
    check_downloaded,
    remove_frontend,
    stop_all,
    stop_frontend,
    run_frontend,
    download_frontend,
    startup
}