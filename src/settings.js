import { enable, isEnabled, disable } from "./services/tauri-plugin-autostart-api.js";

const autostart = document.getElementById("autostart")
autostart.checked = await isEnabled()
autostart.addEventListener("click", async () => {
    if (autostart.checked) await enable()
    else await disable()
})