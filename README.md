# LibRedirect Frontends Manager

<img src="src/assets/imgs/screenshot_1.png" width=700>

Host frontends locally on your computer rather than relying on 3rd party instances. A much better trust-less model.\
For anonymizing your IP, use [Lokinet](https://lokinet.org/)

Available Frontends:
- [LibReddit](https://github.com/spikecodes/libreddit)
- [Teddit](https://github.com/teddit-net/teddit)
- [Nitter](https://github.com/zedeus/nitter)
- [Rimgo](https://codeberg.org/video-prize-ranch/rimgo)
- [SimplyTranslate](https://git.sr.ht/~metalune/simplytranslate_web)
- [LingvaTranslate](https://github.com/TheDavidDelta/lingva-translate)
- [AnonymousOverflow](https://github.com/httpjamesm/AnonymousOverflow)
- [Dumb](https://github.com/rramiachraf/dumb)
- [BiblioReads](https://github.com/nesaku/BiblioReads)
- [ProxiTok](https://github.com/pablouser1/ProxiTok)
- [Quetre](https://github.com/zyachel/quetre)
- [LibreMDb](https://github.com/zyachel/libremdb)
- [SearXNG](https://github.com/searxng/searxng)

For Managing the frontends:
- Web Server: [Caddy](https://caddyserver.com/)
- Cache Server for some frontends: [Redis](https://redis.io/)
- Complex frontends: [Docker](https://www.docker.com/)
- GUI: [Tauri](https://tauri.app/)

## Development
Install [Node.js](https://nodejs.org), [Rust](https://www.rust-lang.org/), [Docker](https://www.docker.com/)
```bash
git clone https://github.com/libredirect/frontends_manager
cd frontends_manager
npm install
npm run tauri dev
```
