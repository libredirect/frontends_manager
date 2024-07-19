import icons from "./services/icons.js";
import { startup, quitApp, refreshApp } from "./services/utils.js";

const Twindow = window.__TAURI__.window;
const event = window.__TAURI__.event;
const invoke = window.__TAURI__.invoke;

document
  .getElementById("refresh")
  .addEventListener("click", async () => await refreshApp());
document.getElementById("settings").addEventListener("click", async () => {
  const settings = await new Twindow.WebviewWindow("settings", {
    url: "settings.html",
    height: 600,
    width: 400,
    center: true,
    title: "Settings",
  });
  await settings.show();
  await settings.center();
});

let frontends_running = {};
let frontends_ports = {};

const res = await invoke("frontends_json");
let config = JSON.parse(res);
await startup(frontends_running);
for (const key in config) {
  const tile = document.createElement("div");
  tile.classList.add("tile");
  tile.innerHTML = `
            <a id="${key}-link" target="_blank">
                <img src="assets/imgs/${config[key].icon}">
                <h1>${config[key].name}</h1>
            </a>
            `;

  tile.innerHTML += `
            <button id="${key}-run">${icons.run}<span>Run</span></button>
            <button id="${key}-close">${icons.close}<span>Close</span></button>
            <button id="${key}-download">${icons.download}<span>Download</span></button>
            <button id="${key}-remove">${icons.remove}<span>Remove</span></button>
            `;
  document.getElementById("frontends").appendChild(tile);
  const downloadElement = document.getElementById(`${key}-download`);
  const linkElement = document.getElementById(`${key}-link`);
  const runElement = document.getElementById(`${key}-run`);
  const closeElement = document.getElementById(`${key}-close`);
  const removeElement = document.getElementById(`${key}-remove`);
  runElement.addEventListener("click", async () => {
    frontends_running[key] = "starting";
    running_buttons();
    frontends_running[key] = await invoke("run_frontend", { frontend: key });
    frontends_ports[key] = await invoke("get_port", { frontend: key });
    running_buttons();
  });
  closeElement.addEventListener("click", async () => {
    frontends_running[key] = "closing";
    running_buttons();
    frontends_running[key] = await invoke("stop_frontend", { frontend: key });
    running_buttons();
  });
  downloadElement.addEventListener("click", async () => {
    frontends_running[key] = "downloading";
    running_buttons();
    frontends_running[key] = await invoke("download_frontend", {
      frontend: key,
    });
    frontends_ports[key] = await invoke("get_port", { frontend: key });
    running_buttons();
  });
  removeElement.addEventListener("click", async () => {
    frontends_running[key] = "removing";
    running_buttons();
    frontends_running[key] = await invoke("remove_frontend", {
      frontend: key,
    });
    running_buttons();
  });
  frontends_running[key] = await invoke("check_downloaded", {
    frontend: key,
  });

  running_buttons();

  function running_buttons() {
    const port = frontends_ports[key];
    if (port)
      tile.getElementsByTagName("a")[0].href = `http://localhost:${port}`;
    switch (frontends_running[key]) {
      case "not_downloaded":
        downloadElement.style.display = "";
        downloadElement.getElementsByTagName("span")[0].innerHTML = "Download";
        downloadElement.style.pointerEvents = "";
        downloadElement.style.userSelect = "";
        downloadElement.style.opacity = 1;

        runElement.style.display = "none";

        linkElement.style.pointerEvents = "none";
        linkElement.style.userSelect = "none";
        linkElement.style.opacity = 0.4;

        closeElement.style.display = "none";

        removeElement.style.display = "none";
        break;
      case "downloading":
        downloadElement.getElementsByTagName("span")[0].innerHTML =
          "Downloading...";
        downloadElement.style.pointerEvents = "none";
        downloadElement.style.userSelect = "none";
        downloadElement.style.opacity = 0.4;

        runElement.style.display = "none";

        linkElement.style.pointerEvents = "none";
        linkElement.style.userSelect = "none";
        linkElement.style.opacity = 0.4;

        closeElement.style.display = "none";

        removeElement.style.display = "none";
        break;
      case "downloaded":
        downloadElement.style.display = "none";

        runElement.style.display = "";
        runElement.getElementsByTagName("span")[0].innerHTML = "Run";
        runElement.style.pointerEvents = "";
        runElement.style.userSelect = "";
        runElement.style.opacity = 1;

        linkElement.style.pointerEvents = "none";
        linkElement.style.userSelect = "none";
        linkElement.style.opacity = 0.4;

        closeElement.style.display = "none";

        removeElement.style.display = "";
        removeElement.getElementsByTagName("span")[0].innerHTML = "Remove";
        removeElement.style.pointerEvents = "";
        removeElement.style.userSelect = "";
        removeElement.style.opacity = 1;
        break;
      case "starting":
        downloadElement.style.display = "none";

        runElement.getElementsByTagName("span")[0].innerHTML = "Starting...";
        runElement.style.pointerEvents = "none";
        runElement.style.userSelect = "none";
        runElement.style.opacity = 0.4;

        linkElement.style.pointerEvents = "none";
        linkElement.style.userSelect = "none";
        linkElement.style.opacity = 0.4;

        closeElement.style.display = "none";

        removeElement.style.display = "none";
        break;
      case "running":
        downloadElement.style.display = "none";

        runElement.style.display = "none";

        linkElement.style.pointerEvents = "";
        linkElement.style.userSelect = "";
        linkElement.style.opacity = 1;

        closeElement.style.display = "";
        closeElement.getElementsByTagName("span")[0].innerHTML = "Close";
        closeElement.style.pointerEvents = "";
        closeElement.style.userSelect = "";
        closeElement.style.opacity = 1;

        removeElement.style.display = "none";
        break;
      case "closing":
        downloadElement.style.display = "none";

        runElement.style.display = "none";

        linkElement.style.pointerEvents = "none";
        linkElement.style.userSelect = "none";
        linkElement.style.opacity = 0.4;

        closeElement.getElementsByTagName("span")[0].innerHTML = "Closing...";
        closeElement.style.pointerEvents = "none";
        closeElement.style.userSelect = "none";
        closeElement.style.opacity = 0.4;

        removeElement.style.display = "none";
        break;
      case "removing":
        downloadElement.style.display = "none";

        runElement.style.display = "none";

        linkElement.style.pointerEvents = "none";
        linkElement.style.userSelect = "none";
        linkElement.style.opacity = 0.4;

        closeElement.style.display = "none";

        removeElement.style.display = "";
        removeElement.getElementsByTagName("span")[0].innerHTML = "Removing...";
        removeElement.style.pointerEvents = "none";
        removeElement.style.userSelect = "none";
        removeElement.style.opacity = 0.4;
        break;
      default:
        break;
    }
  }
}

Twindow.appWindow.onMenuClicked(async ({ payload: menuId }) => {
  if (menuId == "quit") await quitApp(frontends_running);
});

event.listen("tray", async (event) => {
  if (event.payload == "quit") await quitApp(frontends_running);
});
