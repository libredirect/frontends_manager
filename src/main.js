const { app, shell, BrowserWindow, Menu, Tray } = require('electron')
const path = require('path');
const docker = require('./services/docker_frontends')
const executable = require('./services/binary_frontends')

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