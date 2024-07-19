const fs = window.__TAURI__.fs;
const process = window.__TAURI__.process;

export async function startup() {
  const exists = await fs.exists("binary_frontends.json", {
    dir: fs.BaseDirectory.AppLocalData,
  });
  if (!exists) return;

  const contents = await fs.readTextFile("binary_frontends.json", {
    dir: fs.BaseDirectory.AppLocalData,
  });
  const binary_frontends = JSON.parse(contents);
  for (const frontend of binary_frontends) {
    await invoke("run_frontend", { frontend });
  }
}

async function stop_frontends(frontends_running) {
  const binary_frontends = [];
  for (const frontend in frontends_running) {
    if (frontends_running[frontend] == "running") {
      await invoke("stop_frontend", { frontend });
      binary_frontends.push(frontend);
    }
  }
  await fs.writeTextFile(
    "binary_frontends.json",
    JSON.stringify(binary_frontends),
    { dir: fs.BaseDirectory.AppLocalData }
  );
}

export async function quitApp(frontends_running) {
  await stop_frontends(frontends_running);
  await process.exit(0);
}

export async function refreshApp(frontends_running) {
  await stop_frontends(frontends_running);
  window.location.reload();
}