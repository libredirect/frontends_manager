const { ipcRenderer } = require('electron')

function loadJSON(file) {
    return new Promise(resolve => {
        let xobj = new XMLHttpRequest();
        xobj.open('GET', file, true);
        xobj.onreadystatechange = function () {
            if (this.readyState === 4) {
                resolve(JSON.parse(this.responseText));
            }
        }
        xobj.send()
    })
}
let frontends_running = {};
(async () => {
    const config = await loadJSON("config.json")
    let isDockerInstalled = await ipcRenderer.invoke('isDockerInstalled')
    for (const key in config) {
        if (
            !(process.platform == "linux" && config[key].command_linux)
            &&
            !(process.platform == "win32" && config[key].command_windows)
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
        if (config[key].docker && isDockerInstalled == false) {
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
            <button id="${key}-log">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 96 960 960" width="24"
                    fill="currentColor">
                    <path
                        d="M320 816h320v-80H320v80Zm0-160h320v-80H320v80Zm-80 320q-33 0-56.5-23.5T160 896V256q0-33 23.5-56.5T240 176h320l240 240v480q0 33-23.5 56.5T720 976H240Zm280-520V256H240v640h480V456H520ZM240 256v200-200 640-640Z" />
                </svg>
                Log
            </button>
            <button id="${key}-run">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 96 960 960" width="24"
                fill="currentColor">
                <path d="M320 856V296l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
            </svg>
            <span>Run</span>
            </button>
            <button id="${key}-close">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 96 960 960" width="24"
                    fill="currentColor">
                    <path d="M320 416v320-320Zm-80 400V336h480v480H240Zm80-80h320V416H320v320Z" />
                </svg>
                <span>Close</span>
            </button>
            `
            document.getElementById("frontends").appendChild(tile)
            document.getElementById(`${key}-run`).addEventListener("click", () => {
                ipcRenderer.invoke('run', key).then(result => {
                    frontends_running[key] = result;
                    running_buttons(key)
                })
                document.getElementById(`${key}-run`).getElementsByTagName('span')[0].innerHTML = "Be patient it's not broken..."
                document.getElementById(`${key}-run`).style.pointerEvents = 'none'
                document.getElementById(`${key}-run`).style.userSelect = 'none'
                document.getElementById(`${key}-run`).style.opacity = .4
            })
            document.getElementById(`${key}-close`).addEventListener("click", () => {
                ipcRenderer.invoke('close', key).then(result => {
                    frontends_running[key] = result;
                    running_buttons(key)
                })
                document.getElementById(`${key}-close`).getElementsByTagName('span')[0].innerHTML = "Closing..."
                document.getElementById(`${key}-close`).style.pointerEvents = 'none'
                document.getElementById(`${key}-close`).style.userSelect = 'none'
                document.getElementById(`${key}-close`).style.opacity = .4
            })
            document.getElementById(`${key}-log`).addEventListener("click", () => {
                ipcRenderer.send('log', key)
            })

            frontends_running[key] = false
            function running_buttons(name) {
                const linkElement = document.getElementById(`${name}-link`)
                const runElement = document.getElementById(`${name}-run`)
                const closeElement = document.getElementById(`${name}-close`)
                const logElement = document.getElementById(`${name}-log`)
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
                    logElement.style.display = ''
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
                    logElement.style.display = 'none'
                }
            }
            running_buttons(key)
        }
    }
})()
