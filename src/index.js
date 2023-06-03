import binary_frontends from './services/binary_frontends.js'
import docker_frontends from './services/docker_frontends.js'
import icons from './services/icons.js'
import { enable, isEnabled, disable } from "./services/tauri-plugin-autostart-api.js";

const Twindow = window.__TAURI__.window
const path = window.__TAURI__.path;
const fs = window.__TAURI__.fs;
const process = window.__TAURI__.process;
const event = window.__TAURI__.event;

document.getElementById("refresh").addEventListener("click", async () => await refreshApp())
document.getElementById("settings").addEventListener("click", async () => {
    const settings = await new Twindow.WebviewWindow(
        'settings',
        {
            url: 'settings.html',
            height: 600,
            width: 400,
            center: true,
            title: 'Settings'
        });
    await settings.show()
    await settings.center()
})

let frontends_running = {};
(async () => {
    const platform = await window.__TAURI__.os.platform()
    const config = JSON.parse(await fs.readTextFile(await path.resolveResource('frontends.json')))
    let isDockerInstalled = await docker_frontends.health()
    await binary_frontends.run_caddy()
    await binary_frontends.startup()
    if (isDockerInstalled == 'running') {
        await docker_frontends.download_frontend('redis')
        await docker_frontends.run_frontend('redis')
        await docker_frontends.startup()
    }
    for (const key in config) {
        if (!config[key].docker && ((platform == 'linux' && !config[key].command_linux) || (platform == 'win32' && !config[key].command_windows))) continue
        const tile = document.createElement('div')
        tile.classList.add('tile')
        tile.innerHTML = `
            <a id="${key}-link" href="http://${key}.localhost:8080" target="_blank">
                <img src="assets/imgs/${config[key].icon}">
                <h1>${config[key].name}</h1>
            </a>
            `;
        if (config[key].docker && isDockerInstalled == 'not_installed') {
            tile.innerHTML += 'Requires <a class="underline" href="https://www.docker.com" target="_blank">Docker</a>'
            document.getElementById("frontends").appendChild(tile)
            document.getElementById(`${key}-link`).style.pointerEvents = 'none'
            document.getElementById(`${key}-link`).style.userSelect = 'none'
            document.getElementById(`${key}-link`).style.opacity = .4
        } else if (config[key].docker && isDockerInstalled == 'not_running') {
            tile.innerHTML += 'Docker Not Running'
            document.getElementById("frontends").appendChild(tile)
            document.getElementById(`${key}-link`).style.pointerEvents = 'none'
            document.getElementById(`${key}-link`).style.userSelect = 'none'
            document.getElementById(`${key}-link`).style.opacity = .4
        } else {
            tile.innerHTML += `
            <button id="${key}-run">${icons.run}<span>Run</span></button>
            <button id="${key}-close">${icons.close}<span>Close</span></button>
            <button id="${key}-download">${icons.download}<span>Download</span></button>
            <button id="${key}-remove">${icons.remove}<span>Remove</span></button>
            `
            document.getElementById("frontends").appendChild(tile)
            const downloadElement = document.getElementById(`${key}-download`)
            const linkElement = document.getElementById(`${key}-link`)
            const runElement = document.getElementById(`${key}-run`)
            const closeElement = document.getElementById(`${key}-close`)
            const removeElement = document.getElementById(`${key}-remove`)
            runElement.addEventListener("click", async () => {
                frontends_running[key] = 'starting'
                running_buttons()
                if (!config[key].docker) {
                    frontends_running[key] = await binary_frontends.run_frontend(key)
                } else {
                    frontends_running[key] = await docker_frontends.run_frontend(key)
                }
                running_buttons()
            })
            closeElement.addEventListener("click", async () => {
                frontends_running[key] = 'closing'
                running_buttons()
                if (!config[key].docker) {
                    frontends_running[key] = await binary_frontends.stop_frontend(key, true)
                } else {
                    frontends_running[key] = await docker_frontends.stop_frontend(key, true)
                }
                running_buttons()
            })
            downloadElement.addEventListener("click", async () => {
                frontends_running[key] = 'downloading'
                running_buttons()
                if (!config[key].docker) {
                    frontends_running[key] = await binary_frontends.download_frontend(key)
                } else {
                    frontends_running[key] = await docker_frontends.download_frontend(key)
                }
                running_buttons()
            })
            removeElement.addEventListener("click", async () => {
                frontends_running[key] = 'removing'
                running_buttons()
                if (!config[key].docker) {
                    frontends_running[key] = await binary_frontends.remove_frontend(key)
                } else {
                    frontends_running[key] = await docker_frontends.remove_frontend(key)
                }
                running_buttons()
            })

            function running_buttons() {
                switch (frontends_running[key]) {
                    case 'not_downloaded':
                        downloadElement.style.display = ''
                        downloadElement.getElementsByTagName('span')[0].innerHTML = "Download"
                        downloadElement.style.pointerEvents = ''
                        downloadElement.style.userSelect = ''
                        downloadElement.style.opacity = 1

                        runElement.style.display = 'none'

                        linkElement.style.pointerEvents = 'none'
                        linkElement.style.userSelect = 'none'
                        linkElement.style.opacity = .4

                        closeElement.style.display = 'none'

                        removeElement.style.display = 'none'
                        break;
                    case 'downloading':
                        downloadElement.getElementsByTagName('span')[0].innerHTML = "Downloading..."
                        downloadElement.style.pointerEvents = 'none'
                        downloadElement.style.userSelect = 'none'
                        downloadElement.style.opacity = .4

                        runElement.style.display = 'none'

                        linkElement.style.pointerEvents = 'none'
                        linkElement.style.userSelect = 'none'
                        linkElement.style.opacity = .4

                        closeElement.style.display = 'none'

                        removeElement.style.display = 'none'
                        break;
                    case 'downloaded':
                        downloadElement.style.display = 'none'

                        runElement.style.display = ''
                        runElement.getElementsByTagName('span')[0].innerHTML = "Run"
                        runElement.style.pointerEvents = ''
                        runElement.style.userSelect = ''
                        runElement.style.opacity = 1

                        linkElement.style.pointerEvents = 'none'
                        linkElement.style.userSelect = 'none'
                        linkElement.style.opacity = .4

                        closeElement.style.display = 'none'

                        removeElement.style.display = ''
                        removeElement.getElementsByTagName('span')[0].innerHTML = "Remove"
                        removeElement.style.pointerEvents = ''
                        removeElement.style.userSelect = ''
                        removeElement.style.opacity = 1
                        break;
                    case 'starting':
                        downloadElement.style.display = 'none'

                        runElement.getElementsByTagName('span')[0].innerHTML = "Starting..."
                        runElement.style.pointerEvents = 'none'
                        runElement.style.userSelect = 'none'
                        runElement.style.opacity = .4

                        linkElement.style.pointerEvents = 'none'
                        linkElement.style.userSelect = 'none'
                        linkElement.style.opacity = .4

                        closeElement.style.display = 'none'

                        removeElement.style.display = 'none'
                        break;
                    case 'running':
                        downloadElement.style.display = 'none'

                        runElement.style.display = 'none'

                        linkElement.style.pointerEvents = ''
                        linkElement.style.userSelect = ''
                        linkElement.style.opacity = 1

                        closeElement.style.display = ''
                        closeElement.getElementsByTagName('span')[0].innerHTML = "Close"
                        closeElement.style.pointerEvents = ''
                        closeElement.style.userSelect = ''
                        closeElement.style.opacity = 1

                        removeElement.style.display = 'none'
                        break;
                    case 'closing':
                        downloadElement.style.display = 'none'

                        runElement.style.display = 'none'

                        linkElement.style.pointerEvents = 'none'
                        linkElement.style.userSelect = 'none'
                        linkElement.style.opacity = .4

                        closeElement.getElementsByTagName('span')[0].innerHTML = "Closing..."
                        closeElement.style.pointerEvents = 'none'
                        closeElement.style.userSelect = 'none'
                        closeElement.style.opacity = .4

                        removeElement.style.display = 'none'
                        break;
                    case 'removing':
                        downloadElement.style.display = 'none'

                        runElement.style.display = 'none'

                        linkElement.style.pointerEvents = 'none'
                        linkElement.style.userSelect = 'none'
                        linkElement.style.opacity = .4

                        closeElement.style.display = 'none'

                        removeElement.style.display = ''
                        removeElement.getElementsByTagName('span')[0].innerHTML = "Removing..."
                        removeElement.style.pointerEvents = 'none'
                        removeElement.style.userSelect = 'none'
                        removeElement.style.opacity = .4
                        break;
                    default:
                        break;
                }
            }
            if (!config[key].docker) frontends_running[key] = await binary_frontends.check_downloaded(key)
            else frontends_running[key] = await docker_frontends.check_downloaded(key)

            running_buttons()
        }
    }
})()


async function quitApp() {
    const webview = new Twindow.WebviewWindow('quitWindow', { url: 'message.html#Closing', height: 200, width: 400, center: true, title: 'Closing' });
    await binary_frontends.stop_all()
    await docker_frontends.stop_all()
    await webview.close()
    await process.exit(0)
}

async function refreshApp() {
    const webview = new Twindow.WebviewWindow(
        'refreshWindow',
        { url: 'message.html#Refreshing', height: 200, width: 400, center: true, title: 'Refreshing' }
    );
    await binary_frontends.stop_all()
    await docker_frontends.stop_all()
    await webview.close()
    window.location.reload()
}

Twindow.appWindow.onMenuClicked(async ({ payload: menuId }) => {
    if (menuId == 'quit') await quitApp()
});

event.listen("tray", async event => {
    if (event.payload == "quit") await quitApp()
})