const { spawn } = require('child_process')
const fs = require('fs');
const path = require('path');
let frontendsProcesses = {}

const app = require('electron').app
const basepath = path.join(app.getAppPath(), 'src');

const logPath = app.getPath('logs')

function getEnv(env) {
    let obj = {};
    env.forEach(function (property) {
        const tup = property.split('=');
        obj[tup[0]] = tup[1];
    });
    return obj
}

function run_frontend(name, command, args, env) {
    return new Promise(resolve => {
        const child = spawn(command, args, { cwd: path.join(basepath, 'frontends', name), env: env ? getEnv(env) : null })
        frontendsProcesses[name] = child
        const _path = path.join(logPath, `${name}.log`)
        fs.writeFileSync(_path, '');
        child.stdout.setEncoding('utf8')
        child.stderr.on('data', chunk => fs.appendFileSync(_path, chunk));
        child.stdout.on('data', chunk => fs.appendFileSync(_path, chunk))
        resolve(true)
    })
}
exports.run_frontend = run_frontend

function stop_frontend(name) {
    frontendsProcesses[name].kill('SIGINT');
}
exports.stop_frontend = stop_frontend

function stop_all() {
    for (const name of Object.keys(frontendsProcesses)) {
        frontendsProcesses[name].kill('SIGINT');
    }
}
exports.stop_all = stop_all