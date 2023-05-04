const path = require('path');
const { v2 } = require('docker-compose');
const dockerCompose = v2;
const fs = require('fs');
let frontendsProcessesDocker = []

const app = require('electron').app
const basepath = path.join(app.getAppPath(), 'src');

const logPath = app.getPath('logs')

function install_frontend(name) {
    return new Promise(resolve => {
        dockerCompose.upAll({ cwd: path.join(basepath, 'frontends', name) })
            .then(
                () => resolve(),
                err => {
                    resolve(false)
                    console.log(`Docker ${name} installation failed went wrong: ${err.message}`)
                }
            );
    })
}
exports.install_frontend = install_frontend

function run_frontend(name) {
    return new Promise(resolve => {
        dockerCompose.upAll({ cwd: path.join(basepath, 'frontends', name) })
            .then(
                result => {
                    resolve(true)
                    frontendsProcessesDocker.push(name)
                    const _path = path.join(logPath, `${name}.log`)
                    fs.writeFileSync(_path, '');
                    fs.appendFileSync(_path, result.out);
                    fs.appendFileSync(_path, result.err);
                },
                err => {
                    resolve('error')
                    console.log(`Docker ${name} couldn't run: ${err.message}`)
                }
            );
    })
}
exports.run_frontend = run_frontend

async function stop_frontend(name) {
    return await dockerCompose.stop({ cwd: path.join(basepath, 'frontends', name) });
}
exports.stop_frontend = stop_frontend

function health() {
    return new Promise(async resolve => {
        try {
            if ((await dockerCompose.version()).err === '') {
                try {
                    if ((await dockerCompose.ps({ cwd: path.join(basepath, 'frontends', 'biblioreads') })).err === '') {
                        resolve(true)
                    }
                } catch (error) {
                    resolve('not_running')
                }

            } else {
                resolve(false)
            }
        } catch (_) { resolve(false) }
    })
}
exports.health = health


async function stop_all() {
    for (const name of frontendsProcessesDocker) {
        await stop_frontend(name)
    }
}
exports.stop_all = stop_all

