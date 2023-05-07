const pidusage = require('pidusage');

let usage_pids = []
async function get_usage() {
    let stats = {
        cpu: 0,
        memory: 0,
    };
    for (pid of usage_pids) {
        await new Promise(resolve => {
            pidusage(pid, function (err, x) {
                if (!err) {
                    stats.cpu += x.cpu
                    stats.memory += x.memory
                }
                resolve()
            })
        })
    }
    stats.memory = formatBytes(stats.memory)
    stats.cpu = stats.cpu + '%'
    console.log(stats)
}
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

(async () => {
    while (true) {
        await new Promise(r => setTimeout(r, 5000));
        get_usage();
    }
})()