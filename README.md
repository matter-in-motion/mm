# Matter in Motion

## Features
* secure
* duplex
* stateless
* modular architecture
* cluster support
* integrated daemonization
* settings system for any number of environments
* app console
* logging
* request validation
* response validation
* mmp (matter-in-motion protocol)
  - [x] http/https
  - [x] websockets
  - [x] rpc (remote procedure call)
  - [x] events
  - [ ] batch requests
- [ ] nodejs client lib
- [x] browser client lib

## Apps known by Loader

* app - app itself, will be searched at cwd()+'/lib/app'
* cluster_master - cluster master app, will be searched at cwd()+'/lib/claster_master'
* daemon_master - daemon start/stop app, will be searched at cwd()+'/lib/daemon_master'

For any app, if it cannot be found, `mm` default will be used.

## Units known by Loader

* **core.app** - known by app actually (which also is loader), the app itself
* **core.auth** - cryptographic passwords hashing [scrypt](https://github.com/barrysteyn/node-scrypt), [JSON Web Tokens](https://jwt.io) ([RFC 7519](https://tools.ietf.org/html/rfc7519)) encoding/decoding
* **core.validator** — JSON Schema validator ([ajv](https://github.com/epoberezkin/ajv))
* **core.settings** - settings, will be searched at cwd()+'/lib/settings'
* **core.handler** - main app contract, will be searched at cwd()+'/lib/contract'
* **core.logger** - [bunyan](https://github.com/trentm/node-bunyan) based logger
* **core.uncaught** - uncaught exception handler

For both core.settings and core.handler units, if unit cannot be found, `mm` default will be used.

More docs coming soon!

## License

MIT
