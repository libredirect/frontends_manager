const Twindow = window.__TAURI__.window
const shell = window.__TAURI__.shell;
const path = window.__TAURI__.path;
const fs = window.__TAURI__.fs;
const http = window.__TAURI__.http;
const invoke = window.__TAURI__.invoke

Object.values = function (obj) {
    return Object.keys(obj).map(key => obj[key])
}

let platform;
let config;
(async () => {
    platform = await window.__TAURI__.os.platform()
    config = JSON.parse(await (await fetch("/frontends.json")).text())
})();
let frontendsProcesses = {}

function formatEnv(env) {
    if (env === undefined) return null
    let obj = {};
    env.forEach(function (property) {
        const tup = property.split('=');
        obj[tup[0]] = tup[1];
    });
    return obj
}

async function run_caddy() {
    platform = await window.__TAURI__.os.platform()
    const result = await check_downloaded('caddy')
    if (result == 'not_downloaded') {
        const caddy_donloading = new Twindow.WebviewWindow('refreshWindow',
            { url: 'message.html#Downloading Caddy', height: 200, width: 400, center: true },
        );
        let message = await invoke('download_frontend', { frontend: 'caddy' })
        console.log(message)
        caddy_donloading.close()
    }
    let command
    if (platform == 'win32') {
        command = '$APPLOCALDATA\\caddy\\caddy_windows_amd64.exe'
    } else if (platform == 'linux') {
        command = '$APPLOCALDATA/caddy/caddy_linux_amd64'
    }
    const cmd = new shell.Command(command, ['run'], { cwd: await path.join(await path.appLocalDataDir(), 'caddy') })
    cmd.on('error', error => {
        console.error(`command error: "${error}"`)
        return 'downloaded'
    });
    const child = await cmd.spawn();
    frontendsProcesses['caddy'] = child
    return 'running'
}

async function run_frontend(name) {
    return await invoke('run_frontend', { frontend: name });

    // let command
    // if (platform == 'win32') {
    //     command = config[name].command_windows
    // } else if (platform == 'linux') {
    //     command = config[name].command_linux
    // }
    // const cmd = new shell.Command(
    //     command,
    //     config[name].args,
    //     {
    //         cwd: await path.join(await path.appLocalDataDir(), name),
    //         env: formatEnv(config[name].env)
    //     }
    // )
    // console.log(cmd)
    // cmd.on('error', error => {
    //     console.error(`command error: "${error}"`)
    //     return 'downloaded'
    // });
    // const child = await cmd.spaw n();
    // frontendsProcesses[name] = child
    // return 'running'
}

async function download_frontend(name) {
    return await invoke('download_frontend', { frontend: name })
}

async function check_downloaded(name) {
    if (await fs.exists(`${name}`, { dir: fs.BaseDirectory.AppLocalData })) {
        if (name in frontendsProcesses) {
            return "running"
        }
        return 'downloaded'
    }
    return 'not_downloaded'
}
async function remove_frontend(name) {
    await fs.removeDir(name, { dir: fs.BaseDirectory.AppLocalData, recursive: true })
    return 'not_downloaded'
}

async function stop_frontend(name, remove) {
    return await invoke('stop_frontend', { frontend: name })
}

async function stop_all() {
    return await invoke('stop_all')
}

async function startup() {
    if (await fs.exists("binary_frontends.json", { dir: fs.BaseDirectory.AppLocalData })) {
        for (const name of JSON.parse(await fs.readTextFile("binary_frontends.json", { dir: fs.BaseDirectory.AppLocalData }))) {
            await run_frontend(name)
        }
    }
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