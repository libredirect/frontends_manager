const { app, shell, BrowserWindow, Menu, Tray, ipcMain, webContents } = require('electron')
const dockerCompose = require('docker-compose');
const fs = require('fs');

let showWin = true
if (!fs.existsSync('./log')) fs.mkdirSync('./log');
let frontendsProcesses = {}
let frontendsProcessesDocker = []
console.log('Hello weird Arsen!')
app.whenReady().then(() => {
    const win = new BrowserWindow({
        icon: 'assets/imgs/libredirect-256.png',
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    win.loadFile(`${__dirname}/index.html`)

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url)
            return { action: 'deny' }
        }
        return { action: 'allow' }
    })
    // win.removeMenu()

    ipcMain.on('log', (_, name) => {
        const frontendWin = new BrowserWindow({
            title: config[name].name,
            icon: `assets/imgs/${config[name].icon}`,
            width: 900,
            height: 800,
        })
        let path
        if (process.platform == "linux") {
            path = `log/${name}.log`
        } else if (process.platform == "win32") {
            path = `log\\${name}.log`
        }
        frontendWin.loadFile(path)

        let watcher = fs.watch(path, function (event, _) {
            if (event == 'change') {
                frontendWin.reload()
            }
        });
        frontendWin.on("close", () => watcher.close())
    })

    ipcMain.handle('run', async (_, name) => {
        await run_frontends[name]();
        return true
    })

    ipcMain.handle('close', async (_, name) => {
        if (name in frontendsProcesses) {
            frontendsProcesses[name].kill('SIGINT');
        }
        else if (frontendsProcessesDocker.includes(name)) {
            const r = await dockerCompose.stop({ cwd: `${__dirname}/frontends/${name}`, log: true });
        }
        return false
    })

    const trayIcon = new Tray(`${__dirname}/assets/imgs/libredirect-256.png`)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', type: 'normal', click: () => { showWin = true; win.show(); } },
        { label: 'Hide', type: 'normal', click: () => { showWin = false; win.hide(); } },
        { type: 'separator' },
        { label: 'Quit', type: 'normal', click: () => { showWin = false; app.quit(); } }
    ])

    win.addListener("close", e => {
        if (showWin) {
            showWin = false
            win.hide()
            e.preventDefault()
        }
    })

    trayIcon.addListener("click", () => {
        showWin = !showWin
        if (!showWin) win.hide()
        else win.show()
    })
    trayIcon.setContextMenu(contextMenu)
})

function getEnv(env) {
    var properties = env.split(', ');
    var obj = {};
    properties.forEach(function (property) {
        var tup = property.split('=');
        obj[tup[0]] = tup[1];
    });
    return obj
}

const { spawn } = require('child_process')
if (!fs.existsSync('./log')) fs.mkdirSync('./log');
function run_frontend(name, command, args, env) {
    return new Promise(resolve => {
        let child
        if (env) {
            if (process.platform == "linux") {
                child = spawn(command, args, { cwd: __dirname + `/frontends/${name}`, env: getEnv(env) })
            } else if (process.platform == "win32") {
                child = spawn(command, args, { cwd: __dirname + `\\frontends\\${name}`, env: getEnv(env) })
            }
        } else {
            if (process.platform == "linux") {
                child = spawn(command, args, { cwd: __dirname + `/frontends/${name}` })
            } else if (process.platform == "win32") {
                child = spawn(command, args, { cwd: __dirname + `\\frontends\\${name}` })
            }
        }
        resolve()
        frontendsProcesses[name] = child
        let path
        if (process.platform == "linux") {
            path = `log/${name}.log`
        } else if (process.platform == "win32") {
            path = `log\\${name}.log`
        }
        fs.writeFileSync(path, '');
        child.stdout.setEncoding('utf8')
        child.stderr.on('data', chunk => fs.appendFileSync(path, chunk));
        child.stdout.on('data', chunk => fs.appendFileSync(path, chunk))
    })

}
function run_frontend_docker(name) {
    return new Promise(resolve => {
        dockerCompose.upAll({ cwd: `${__dirname}/frontends/${name}`, log: true })
            .then(
                result => {
                    resolve()
                    frontendsProcessesDocker.push(name)
                    let path
                    if (process.platform == "linux") {
                        path = `log/${name}.log`
                    } else if (process.platform == "win32") {
                        path = `log\\${name}.log`
                    }
                    fs.writeFileSync(path, '');
                    fs.appendFileSync(path, result.out);
                    fs.appendFileSync(path, result.err);
                },
                err => {
                    console.log('something went wrong:', err.message)
                }
            );
    })
}

const net = require('net');
const { dirname } = require('path');
function cehck_port(port) {
    return new Promise(resolve => {
        var sock = new net.Socket()
        sock.setTimeout(2500)
        sock
            .on('connect', () => {
                sock.destroy()
                resolve(true)
            })
            .on('error', () => resolve(false))
            .connect(port, '127.0.0.1')
    })
}

let run_frontends = {}
const config = JSON.parse(fs.readFileSync(__dirname + '/config.json'))
for (const key in config) {
    const val = config[key]
    if (!val.docker) {
        if (process.platform == "linux" && val.command_linux) {
            run_frontends[key] = () => run_frontend(key, val.command_linux, val.args, val.env)
        } else if (process.platform == "win32" && val.command_windows) {
            run_frontends[key] = () => run_frontend(key, val.command_windows, val.args, val.env)
        }
    } else {
        run_frontends[key] = () => run_frontend_docker(key)
    }
}

(async () => {
    if (process.platform == "linux") {
        run_frontend('caddy', './caddy_linux_amd64', ['run'])
        run_frontend('redis', './redis-stable/src/redis-server', [])
        while (!(await cehck_port(6379))) { }
    } else if (process.platform == "win32") {
        run_frontend('caddy', '.\\caddy_windows_amd64.exe', ['run'])
    }
    for (const k of Object.keys(run_frontends)) {
        run_frontends[k]()
    }
})();

let readyToQuite = false
app.on("before-quit", async event => {
    if (readyToQuite) return
    event.preventDefault();
    const closeWin = new BrowserWindow({
        icon: 'assets/imgs/libredirect-256.png',
        width: 400,
        height: 200,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    closeWin.loadFile(`${__dirname}/closing.html`)
    closeWin.removeMenu()
    for (const name of Object.keys(frontendsProcesses)) {
        frontendsProcesses[name].kill('SIGINT');
    }
    for (const name of frontendsProcessesDocker) {
        await dockerCompose.stop({ cwd: `${__dirname}/frontends/${name}`, log: true })
    }
    readyToQuite = true
    closeWin.close()
    readyToQuite = true
    app.quit()
})