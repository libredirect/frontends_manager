const net = require('net');
function check_port(port) {
    return new Promise(resolve => {
        var sock = new net.Socket()
        sock.setTimeout(2500)
        sock
            .on('connect', () => {
                sock.destroy()
                resolve(true)
            })
            .on('error', () => resolve(false))
            .connect(port, '127.0.0.1')
    })
}
exports.check_port = check_port