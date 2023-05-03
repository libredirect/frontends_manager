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
                Run
            </button>
            <button id="${key}-close">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 96 960 960" width="24"
                    fill="currentColor">
                    <path d="M320 416v320-320Zm-80 400V336h480v480H240Zm80-80h320V416H320v320Z" />
                </svg>
                Close
            </button>
            `;

        document.getElementById("frontends").appendChild(tile)

        document.getElementById(`${key}-log`).addEventListener("click", () => {
            ipcRenderer.send('log', key)
        })

        function running_buttons(name) {
            if (frontends_running[name]) {
                document.getElementById(`${name}-link`).style.pointerEvents = ''
                document.getElementById(`${name}-link`).style.userSelect = ''
                document.getElementById(`${name}-link`).style.opacity = 1
                document.getElementById(`${name}-run`).style.display = 'none'
                document.getElementById(`${name}-close`).style.display = ''
                document.getElementById(`${name}-log`).style.display = ''
            } else {
                document.getElementById(`${name}-link`).style.pointerEvents = 'none'
                document.getElementById(`${name}-link`).style.userSelect = 'none'
                document.getElementById(`${name}-link`).style.opacity = .4
                document.getElementById(`${name}-run`).style.display = ''
                document.getElementById(`${name}-close`).style.display = 'none'
                document.getElementById(`${name}-log`).style.display = 'none'
            }
        }
        frontends_running[key] = false
        document.getElementById(`${key}-run`).addEventListener("click", () => {
            ipcRenderer.invoke('run', key)
                .then((msg) => {
                    frontends_running[key] = msg;
                    running_buttons(key)
                })
        })
        document.getElementById(`${key}-close`).addEventListener("click", () => {
            ipcRenderer.invoke('close', key).then((msg) => {
                frontends_running[key] = msg;
                running_buttons(key)
            })
        })
        running_buttons(key)
    }
})()
