const shell = window.__TAURI__.shell;
const path = window.__TAURI__.path;
const fs = window.__TAURI__.fs;
const http = window.__TAURI__.http

Object.values = function (obj) {
    return Object.keys(obj).map(key => obj[key])
}

let platform;
let config;
(async () => {
    platform = await window.__TAURI__.os.platform()
    config = JSON.parse(await fs.readTextFile(await path.resolveResource('frontends.json')))
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
        let filename
        let url
        if (platform == 'linux') {
            filename = 'caddy_linux_amd64'
            url = 'https://caddyserver.com/api/download?os=linux&arch=amd64'
        } else if (platform == 'win32') {
            filename = 'caddy_windows_amd64.exe'
            url = 'https://caddyserver.com/api/download?os=windows&arch=amd64'
        }
        filename = await path.join('caddy', filename)
        const response = await http.fetch(url, { method: 'GET', responseType: http.ResponseType.Binary });
        await fs.createDir('caddy', { dir: fs.BaseDirectory.AppLocalData, recursive: true });
        await fs.writeBinaryFile(filename, new Uint8Array(response.data), { dir: fs.BaseDirectory.AppLocalData });
        if (platform == 'linux') {
            await new shell.Command('chmod', ['u+x', filename], { cwd: await path.appLocalDataDir() }).execute();
        }
    }
    let command
    if (platform == 'win32') {
        command = '$APPLOCALDATA\\caddy\\caddy_windows_amd64.exe'
    } else if (platform == 'linux') {
        command = '$APPLOCALDATA/caddy/caddy_linux_amd64'
    }
    const cmd = new shell.Command(command, ['run'], { cwd: await path.resolveResource('') })
    cmd.on('error', error => {
        console.error(`command error: "${error}"`)
        return 'downloaded'
    });
    const child = await cmd.spawn();
    frontendsProcesses['caddy'] = child
    return 'running'
}

async function download_stdin_parser() {
    if (await check_downloaded('stdin_parser') == "not_downloaded") {
        let filename
        if (platform == "linux") {
            filename = "stdin_parser_linux_x86_64"
        } else if (platform = "win32") {
            filename = "stdin_parser_windows_x86_64.exe"
        }

        await download_frontend('stdin_parser')
        const _path = await path.join('stdin_parser', 'org.libredirect.stdin_parser.json')
        let data = JSON.parse(await fs.readTextFile(_path, { dir: fs.BaseDirectory.AppLocalData }));
        data.path = await path.join(await path.appLocalDataDir(), 'stdin_parser', filename)
        await fs.writeTextFile(_path, JSON.stringify(data), { dir: fs.BaseDirectory.AppLocalData })

        if (platform == "linux") {
            await fs.copyFile(_path, await path.join(await path.homeDir(), '.mozilla', 'native-messaging-hosts', 'org.libredirect.stdin_parser.json'), { dir: fs.BaseDirectory.AppLocalData })
        }
    }
    (async () => {
        while (true) {
            const data = await fs.readTextFile(await path.join('stdin_parser', 'settings.json'), { dir: fs.BaseDirectory.AppLocalData })
            console.log(JSON.parse(data))
            await new Promise(resolve => setTimeout(async () => resolve(), 1000))
        }
    })()
}

async function run_frontend(name) {
    let command
    if (platform == 'win32') {
        command = config[name].command_windows
    } else if (platform == 'linux') {
        command = config[name].command_linux
    }
    const cmd = new shell.Command(command, config[name].args, { cwd: await path.join(await path.appLocalDataDir(), name), env: formatEnv(config[name].env) })
    console.log(cmd)
    cmd.on('error', error => {
        console.error(`command error: "${error}"`)
        return 'downloaded'
    });
    const child = await cmd.spawn();
    frontendsProcesses[name] = child
    return 'running'
}

function download_frontend(name) {
    return new Promise(async resolve => {
        let filename
        if (platform == 'linux') {
            filename = `${name}_linux_x86_64.tar.gz`
        } else if (platform == 'win32') {
            filename = `${name}_windows_x86_64.zip`
        }
        const response = await http.fetch(
            `https://github.com/libredirect/frontends_binaries/raw/main/binaries/${filename}`,
            { method: 'GET', responseType: http.ResponseType.Binary }
        );
        await fs.writeBinaryFile(filename, new Uint8Array(response.data), { dir: fs.BaseDirectory.AppLocalData });
        let extract_cmd
        if (platform == 'linux') {
            extract_cmd = new shell.Command('tar', ['-xzf', filename], { cwd: await path.appLocalDataDir() })
        } else if (platform == 'win32') {
            extract_cmd = new shell.Command('tar', ['-xf', filename], { cwd: await path.appLocalDataDir() })
        }
        extract_cmd.on('close', async () => {
            await fs.removeFile(filename, { dir: fs.BaseDirectory.AppLocalData })
            resolve('downloaded')
        });
        await extract_cmd.spawn();
    })
}

async function check_downloaded(name) {
    if (await fs.exists(`${name}`, { dir: fs.BaseDirectory.AppLocalData })) {
        return 'downloaded'
    } else {
        return 'not_downloaded'
    }
}
async function remove_frontend(name) {
    await fs.removeDir(name, { dir: fs.BaseDirectory.AppLocalData, recursive: true })
    return 'not_downloaded'
}

async function stop_frontend(name, slice) {
    const result = await frontendsProcesses[name].kill();
    if (slice) delete [name]
    if (result == null) return 'downloaded'
    else return 'running'
}

async function stop_all() {
    for (const name of Object.keys(frontendsProcesses)) {
        await stop_frontend(name, false)
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
    download_stdin_parser
}