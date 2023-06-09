const shell = window.__TAURI__.shell;
const path = window.__TAURI__.path;
const tauri = window.__TAURI__.tauri;
const fs = window.__TAURI__.fs;

let frontendsProcessesDocker = []

async function docker_command(name, action) {
    return new shell.Command('docker', ['compose', '-f', `${name}.yml`, action], { cwd: await path.resolveResource('docker_frontends') })
}

async function download_frontend(name) {
    return new Promise(async resolve => {
        const cmd = await docker_command(name, 'create')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(false) });
        cmd.on('close', data => {
            resolve('downloaded')
        });
        await cmd.spawn()
    })
}

async function check_downloaded(name) {
    return new Promise(async resolve => {
        const cmd = new shell.Command(
            'docker', ['ps', '-a', '--format', 'json', '--filter', `name=${name}`],
            { cwd: await path.resolveResource('docker_frontends') }
        )
        cmd.on('close', () => resolve('not_downloaded'));
        cmd.stdout.on('data', data => {
            frontendsProcessesDocker.push(name)
            const state = JSON.parse(data).State
            if (state == "running") {
                resolve('running')
            } else {
                resolve('downloaded')
            }
        })
        await cmd.spawn()
    })
}

async function run_frontend(name) {
    return new Promise(async resolve => {
        const cmd = await docker_command(name, 'start')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(false) });
        cmd.on('close', async () => {
            frontendsProcessesDocker.push(name)
            resolve('running')
        });
        await cmd.spawn()
    })

}
function stop_frontend(name, slice) {
    return new Promise(async resolve => {
        const cmd = await docker_command(name, 'stop')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(true) });
        cmd.on('close', () => {
            if (slice) frontendsProcessesDocker.splice(frontendsProcessesDocker.indexOf(name), 1)
            resolve('downloaded')
        });
        await cmd.spawn()
    })

}

async function remove_frontend(name) {
    return new Promise(async resolve => {
        const cmd = await docker_command(name, 'down')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(true) });
        cmd.stdout.on('data', line => console.log(line))
        cmd.stderr.on('data', () => resolve('not_downloaded'))
        await cmd.spawn();
    })
}

function health() {
    return new Promise(async resolve => {
        try {
            const cmd = new shell.Command('docker', ['compose', 'version'])
            cmd.on('error', () => resolve('not_installed'));
            cmd.stderr.on('data', () => resolve('not_installed'))
            cmd.stdout.on('data', async () => {
                const cmd = new shell.Command('docker', ['ps'])
                cmd.on('error', () => resolve('not_running'));
                cmd.stdout.on('data', () => resolve('running'))
                cmd.stderr.on('data', () => resolve('not_running'))
                await cmd.spawn();
            })
            await cmd.spawn();
        } catch (error) {
            resolve('not_installed')
        }
    })
}

async function stop_all() {
    await fs.writeTextFile("docker_frontends.json", JSON.stringify(frontendsProcessesDocker), { dir: fs.BaseDirectory.AppLocalData })
    for (const name of frontendsProcessesDocker) {
        await stop_frontend(name, false)
    }
}

async function startup() {
    if (await fs.exists("docker_frontends.json", { dir: fs.BaseDirectory.AppLocalData })) {
        for (const name of JSON.parse(await fs.readTextFile("docker_frontends.json", { dir: fs.BaseDirectory.AppLocalData }))) {
            await run_frontend(name)
        }
    }
}

export default {
    download_frontend,
    run_frontend,
    stop_frontend,
    remove_frontend,
    check_downloaded,
    health,
    stop_all,
    startup
}
