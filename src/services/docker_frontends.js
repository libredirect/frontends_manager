const shell = window.__TAURI__.shell;
const path = window.__TAURI__.path;
const fs = window.__TAURI__.fs;

let frontendsProcessesDocker = []

async function docker_command(name, action) {
    return new shell.Command('docker', ['compose', '-f', `${name}.yml`, action], { cwd: await path.resolveResource('docker_frontends') })
}

async function install_frontend(name) {
    return new Promise(async resolve => {
        const cmd = docker_command(name, 'create')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(false) });
        cmd.on('close', data => {
            console.log(`command finished with code ${data.code} and signal ${data.signal}`)
            resolve(true)
        });
        await cmd.spawn()
        frontendsProcessesDocker.push(name)
        resolve(true)
    })
}

async function run_frontend(name) {
    return new Promise(async resolve => {
        const cmd = docker_command(name, 'up')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(false) });
        cmd.on('close', data => {
            console.log(`command finished with code ${data.code} and signal ${data.signal}`)
            resolve(true)
        });
        await cmd.spawn()
        frontendsProcessesDocker.push(name)
    })

}
async function stop_frontend(name) {
    return new Promise(async resolve => {
        const cmd = docker_command(name, 'stop')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(true) });
        cmd.on('close', data => {
            console.log(`command finished with code ${data.code} and signal ${data.signal}`)
            resolve(false)
        });
        await cmd.spawn()
    })

}

async function remove_frontend(name) {
    return new Promise(async resolve => {
        const cmd = docker_command(name, 'rm')
        cmd.on('error', error => { console.error(`command error: "${error}"`); resolve(true) });
        cmd.stdout.on('data', line => console.log(line))
        cmd.stderr.on('data', () => resolve(true))
        await cmd.spawn();
        resolve(false)
    })

}

function health() {
    return new Promise(async resolve => {
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
    })
}

async function stop_all() {
    for (const name of frontendsProcessesDocker) {
        await stop_frontend(name)
    }
}

export default {
    install_frontend,
    run_frontend,
    stop_frontend,
    remove_frontend,
    health,
    stop_all
}
