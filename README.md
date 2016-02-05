# Matter in Motion

## Features
* modular architecture
* settings system with any number of environments
* cluster support
* integrated daemonization
* app console
* logging
* mmp (matter-in-motion protocol) supports:
  - [x] http/https
  - [x] websockets
  - [ ] batch requests
- [ ] client lib for node.js
- [x] clietn lib for browser

## Apps known by Loader

* app - app itself, will be searched at cwd()+'/lib/app'
* cluster_master - cluster master app, will be searched at cwd()+'/lib/claster_master'
* daemon_master - daemon start/stop app, will be searched at cwd()+'/lib/daemon_master'

For any app, if it cannot be found, `mm` default will be used.

## Units known by Loader

* core.app - known by app actually (which also is loader), the app itself
* core.uncaught - uncaught exception handler
* core.logger - [bunyan](https://github.com/trentm/node-bunyan) based logger

* core.settings - settings, will be searched at cwd()+'/lib/settings'
* core.handler - main app contract, will be searched at cwd()+'/lib/contract'

For both core.settings and core.handler units, if unit cannot be found, `mm` default will be used.

## License

MIT
