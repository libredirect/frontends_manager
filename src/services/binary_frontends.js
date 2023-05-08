const shell = window.__TAURI__.shell;
const path = window.__TAURI__.path;
const fs = window.__TAURI__.fs;
const Twindow = window.__TAURI__.window
const http = window.__TAURI__.http

let platform;
(async () => {
    platform = await window.__TAURI__.os.platform()
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

async function run_caddy(platform) {
    let command
    if (platform == 'windows ') {
        command = '.\\caddy_windows_amd64.exe'
    } else if (platform == 'linux') {
        command = './caddy_linux_amd64'
    }
    const cmd = new shell.Command(command, ['run'], { cwd: await path.resolveResource('caddy') })
    cmd.on('error', error => {
        console.error(`command error: "${error}"`)
        return false
    });

    const child = await cmd.spawn();
    frontendsProcesses['caddy'] = child
    return true
}

async function run_frontend(name, command, args, env) {
    if (platform == 'linux') {
        const cmd = new shell.Command('chmod', ['u+x', command], { cwd: await path.appDataDir(), env: formatEnv(env) })
        await cmd.spawn();
    }
    const cmd = new shell.Command(command, args, { cwd: await path.appDataDir(), env: formatEnv(env) })
    cmd.on('error', error => {
        console.error(`command error: "${error}"`)
        return 'downloaded'
    });
    const child = await cmd.spawn();
    frontendsProcesses[name] = child
    return 'running'
}

async function download_frontend(name) {
    const response = await http.fetch(`https://github.com/libredirect/frontends_binaries/raw/main/${name}/${name}_${platform}_x86_64`, {
        method: 'GET',
        timeout: 30,
        responseType: http.ResponseType.Binary
    });
    await fs.writeBinaryFile(`${name}_${platform}_x86_64`, new Uint8Array(response.data), { dir: fs.BaseDirectory.AppData });
    return 'downloaded'
}

async function check_downloaded(name) {
    if (await fs.exists(`${name}_${platform}_x86_64`, { dir: fs.BaseDirectory.AppData })) {
        return 'downloaded'
    } else {
        return 'not_downloaded'
    }
}
async function remove_frontend(name) {
    await fs.removeFile(`${name}_${platform}_x86_64`, { dir: fs.BaseDirectory.AppData })
    return 'not_downloaded'
}

async function stop_frontend(name) {
    const result = await frontendsProcesses[name].kill();
    if (result == null) return 'downloaded'
    else return 'running'
}

async function stop_all() {
    for (const name of Object.keys(frontendsProcesses)) {
        await frontendsProcesses[name].kill();
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
}