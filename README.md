# LibRedirect Frontends Manager

<img src="src/assets/imgs/screenshot_1.png" width=700>

Host frontends locally on your computer rather than relying on 3rd party instances. A much better trust-less model.\
For anonymizing your IP, use [Lokinet](https://lokinet.org/)

Available Frontends:
- [LibReddit](https://github.com/spikecodes/libreddit)
- [Rimgo](https://codeberg.org/video-prize-ranch/rimgo)
- [SimplyTranslate](https://codeberg.org/SimpleWeb/SimplyTranslate)
- [AnonymousOverflow](https://github.com/httpjamesm/AnonymousOverflow)
- [Dumb](https://github.com/rramiachraf/dumb)

For Managing the frontends:
- Web Server: [Caddy](https://caddyserver.com/)
- GUI: [Tauri](https://tauri.app/)

## Development
Install [Node.js](https://nodejs.org), [Rust](https://www.rust-lang.org/)
```bash
git clone https://github.com/libredirect/frontends_manager
cd frontends_manager
npm install
npm run tauri dev
```
