import binary_frontends from './services/binary_frontends.js'
import docker_frontends from './services/docker_frontends.js'
import icons from './services/icons.js'

const Twindow = window.__TAURI__.window
const path = window.__TAURI__.path;
const fs = window.__TAURI__.fs;

let frontends_running = {};
(async () => {
    const platform = await window.__TAURI__.os.platform()
    const config = JSON.parse(await fs.readTextFile(await path.resolveResource('frontends.json')))
    let isDockerInstalled = await docker_frontends.health()
    console.log(isDockerInstalled)
    if (platform == "linux") {
        binary_frontends.run_frontend('caddy', './caddy_linux_amd64', ['run'])
    } else if (platform == "win32") {
        binary_frontends.run_frontend('caddy', '.\\caddy_windows_amd64.exe', ['run'])
    }
    docker_frontends.run_frontend('redis')
    for (const key in config) {
        if (
            !(platform == "linux" && config[key].command_linux)
            &&
            !(platform == "win32" && config[key].command_windows)
            &&
            !config[key].docker
        ) continue
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
            document.getElementById(`${key}-run`).addEventListener("click", () => {
                if (!config[key].docker) {
                    binary_frontends.run_frontend(
                        key, ({ "linux": config[key].command_linux, "win32": config[key].command_windows })[platform], config[key].args, config[key].env)
                        .then(result => {
                            frontends_running[key] = result;
                            running_buttons(key)
                        })
                } else {
                    docker_frontends.run_frontend(key)
                        .then(result => {
                            frontends_running[key] = result;
                            running_buttons(key)
                        })
                }
                document.getElementById(`${key}-run`).getElementsByTagName('span')[0].innerHTML = "Be patient it's not broken..."
                document.getElementById(`${key}-run`).style.pointerEvents = 'none'
                document.getElementById(`${key}-run`).style.userSelect = 'none'
                document.getElementById(`${key}-run`).style.opacity = .4
            })
            document.getElementById(`${key}-close`).addEventListener("click", () => {
                if (!config[key].docker) {
                    binary_frontends.stop_frontend(key).then(result => {
                        frontends_running[key] = result;
                        running_buttons(key)
                    })
                } else {
                    docker_frontends.stop_frontend(key).then(result => {
                        frontends_running[key] = result;
                        running_buttons(key)
                    })
                }
                document.getElementById(`${key}-close`).getElementsByTagName('span')[0].innerHTML = "Closing..."
                document.getElementById(`${key}-close`).style.pointerEvents = 'none'
                document.getElementById(`${key}-close`).style.userSelect = 'none'
                document.getElementById(`${key}-close`).style.opacity = .4
            })

            frontends_running[key] = false
            function running_buttons(name) {
                const linkElement = document.getElementById(`${name}-link`)
                const runElement = document.getElementById(`${name}-run`)
                const closeElement = document.getElementById(`${name}-close`)
                if (frontends_running[name] == 'error') {
                    runElement.getElementsByTagName('span')[0].innerHTML = "Error..."
                    runElement.style.pointerEvents = ''
                    runElement.style.userSelect = ''
                    runElement.style.opacity = 1
                } else if (frontends_running[name] == true) {
                    linkElement.style.pointerEvents = ''
                    linkElement.style.userSelect = ''
                    linkElement.style.opacity = 1
                    runElement.style.display = 'none'
                    runElement.getElementsByTagName('span')[0].innerHTML = "Run"
                    runElement.style.pointerEvents = ''
                    runElement.style.userSelect = ''
                    runElement.style.opacity = 1
                    closeElement.style.display = ''
                } else if (frontends_running[name] == false) {
                    linkElement.style.pointerEvents = 'none'
                    linkElement.style.userSelect = 'none'
                    linkElement.style.opacity = .4
                    runElement.style.display = ''
                    closeElement.getElementsByTagName('span')[0].innerHTML = "Close"
                    closeElement.style.pointerEvents = ''
                    closeElement.style.userSelect = ''
                    closeElement.style.opacity = 1
                    closeElement.style.display = 'none'
                }
                document.getElementById(`${name}-download`).style.display = 'none'
                document.getElementById(`${name}-remove`).style.display = 'none'
            }
            running_buttons(key)
        }
    }
})()
