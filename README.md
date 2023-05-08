# LibRedirect Frontends Manager

<img src="src/assets/imgs/screenshot_1.png" width=700>

Host frontends locally on your computer rather than relying on 3rd party instances, and anonymize your IP through Loki (still not implemented). A much better trust-less model.

Available Frontends:
- [BreezeWiki](https://breezewiki.com/) (inux)
- [LibReddit](https://github.com/spikecodes/libreddit) (linux, windows)
- [Nitter](https://github.com/zedeus/nitter) (linux)
- [Rimgo](https://codeberg.org/video-prize-ranch/rimgo) (linux, windows)
- [SimplyTranslate](https://git.sr.ht/~metalune/simplytranslate_web) (linux)
- [AnonymousOverflow](https://github.com/httpjamesm/AnonymousOverflow) (linux, windows)
- [Dumb](https://github.com/rramiachraf/dumb) (linux, windows)
- [BiblioReads](https://github.com/nesaku/BiblioReads) (docker)
- [ProxiTok](https://github.com/pablouser1/ProxiTok) (docker)
- [Quetre](https://github.com/zyachel/quetre) (docker)
- [LibreMDb](https://github.com/zyachel/libremdb) (docker)
- [SearXNG](https://github.com/searxng/searxng) (docker)

For Managing the frontends:
- Web Server: [Caddy](https://caddyserver.com/)
- Cache Server: [Redis](https://redis.io/)
- GUI: [Tauri](https://tauri.app/)

## Development
Install [Rust](https://www.rust-lang.org/)\
Install [Tauri](https://tauri.app/)\
Install [Docker](https://www.docker.com/)
```bash
git clone https://github.com/libredirect/frontends_manager
cd frontends_manager
npm install
npm run tauri dev
```