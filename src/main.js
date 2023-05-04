const { app, shell, BrowserWindow, Menu, Tray, ipcMain } = require('electron')
const docker = require('./services/docker')
const executable = require('./services/executable')
const utils = require('./services/utils')
const fs = require('fs');
const path = require('path');

const logPath = app.getPath('logs')
let showWin = true

app.whenReady().then(() => {
    (async () => {
        isDockerInstalled = await docker.health()
        for (const key in config) {
            const val = config[key]
            if (!val.docker) {
                if (process.platform == "linux" && val.command_linux) {
                    run_frontends[key] = () => executable.run_frontend(key, val.command_linux, val.args, val.env)
                } else if (process.platform == "win32" && val.command_windows) {
                    run_frontends[key] = () => executable.run_frontend(key, val.command_windows, val.args, val.env)
                }
            } else if (isDockerInstalled) {
                run_frontends[key] = () => docker.run_frontend(key)
            }
        }
        if (process.platform == "linux") {
            executable.run_frontend('caddy', './caddy_linux_amd64', ['run'])
            executable.run_frontend('redis', './redis-stable/src/redis-server', ['./redis.conf'])
            while (!(await utils.check_port(6379))) { } // waiting for redis...
        } else if (process.platform == "win32") {
            executable.run_frontend('caddy', '.\\caddy_windows_amd64.exe', ['run'])
        }

        const win = new BrowserWindow({
            icon: path.join(__dirname, 'assets', 'imgs', 'icon.png'),
            width: 1200, height: 800,
            webPreferences: { nodeIntegration: true, contextIsolation: false },
        })
        win.loadFile(path.join(__dirname, 'index.html'))

        win.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('http')) {
                shell.openExternal(url)
                return { action: 'deny' }
            }
            return { action: 'allow' }
        })
        // win.removeMenu()
        win.maximize()

        ipcMain.on('log', (_, name) => {
            const _path = path.join(logPath, `${name}.log`)
            if (!fs.existsSync(_path)) return
            const frontendWin = new BrowserWindow({
                title: config[name].name,
                icon: path.join(__dirname, 'assets', 'imgs', config[name].icon),
                width: 900, height: 800,
            })
            frontendWin.loadFile(_path)
            let watcher = fs.watch(_path, function (event, _) {
                if (event == 'change') frontendWin.reload()
                else frontendWin.close()
            });
            frontendWin.on("close", () => watcher.close())
        })

        ipcMain.handle('run', async (_, name) => {
            await run_frontends[name]();
            return true
        })

        ipcMain.handle('close', async (_, name) => {
            if (config[name].docker) {
                await docker.stop_frontend(name)
            } else {
                executable.stop_frontend(name)
            }
            return false
        })

        ipcMain.handle('isDockerInstalled', async () => {
            return isDockerInstalled;
        })

        const trayIcon = new Tray(path.join(__dirname, 'assets', 'imgs', 'icon.png'))
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
    })();
})

let run_frontends = {}
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')))
let isDockerInstalled = false;


let readyToQuite = false
app.on("before-quit", async event => {
    if (readyToQuite) return
    event.preventDefault();
    const closeWin = new BrowserWindow({
        icon: path.join(__dirname, 'assets', 'imgs', 'icon.png'),
        width: 400, height: 200,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
    })
    closeWin.loadFile(path.join(__dirname, 'closing.html'))
    closeWin.removeMenu()
    closeWin.resizable = false
    executable.stop_all()
    docker.stop_all()
    readyToQuite = true
    closeWin.close()
    app.quit()
})