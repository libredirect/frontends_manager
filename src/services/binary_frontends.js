const shell = window.__TAURI__.shell;
const path = window.__TAURI__.path;
const fs = window.__TAURI__.fs;

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

async function run_frontend(name, command, args, env) {
    const cmd = new shell.Command(command, args, { cwd: await path.resolveResource(await path.join('binary_frontends', name)), env: formatEnv(env) })
    cmd.on('error', error => {
        console.error(`command error: "${error}"`)
        return false
    });
    const child = await cmd.spawn();
    frontendsProcesses[name] = child
    return true
}

async function download_frontend(name) {

}

async function stop_frontend(name) {
    const result = await frontendsProcesses[name].kill();
    if (result == null) return false
    else return true
}

async function stop_all() {
    for (const name of Object.keys(frontendsProcesses)) {
        await frontendsProcesses[name].kill();
    }
}

export default {
    stop_all,
    stop_frontend,
    run_frontend,
}