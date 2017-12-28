# Matter In Motion

[![NPM Version](https://img.shields.io/npm/v/matter-in-motion.svg?style=flat-square)](https://www.npmjs.com/package/matter-in-motion)
[![NPM Downloads](https://img.shields.io/npm/dt/matter-in-motion.svg?style=flat-square)](https://www.npmjs.com/package/matter-in-motion)

## Node.js framework and protocol with the focus on real-time applications, blazing response time and low memory footprint.

## Why not REST?

Put simply, real world application needs more than GET, POST, PUT, DELETE. Real world applications use more than just HTTP. How about WebSockets? MQTT? Events? Notifications?

### Features
* **~250ms** startup time for simple demo application worker
* **Under 1s** startup time for real world application cluster with 8 workers
* **Secure** built-in authtorisation with cryptographic passwords hashing [bcrypt](https://github.com/ncb000gt/node.bcrypt.js), [JSON Web Tokens](https://jwt.io) ([RFC 7519](https://tools.ietf.org/html/rfc7519)) encoding/decoding
* **Simple modular extensible architecture to build complex RPC APIs.** (Code base in production since 2013)
* **Request and response data validation** using declarative style API and JSON Schema validator ([ajv](https://github.com/epoberezkin/ajv))
* **Built-in API auto discovery**
* **Simple error handling**
* **Built-in API auto tests (in progress)**

## Usage

1. [Getting started](https://github.com/matter-in-motion/mm/blob/master/docs/getting-started.md) — explanations of framework's architecture and a tutorial with all the steps to make an application from scratch
2. Clone the [demo application](https://github.com/matter-in-motion/demo).

## Content

* [Units](https://github.com/matter-in-motion/mm/blob/master/docs/units.md)
* [Protocol](https://github.com/matter-in-motion/mm/blob/master/docs/protocol.md)
* [Settings](https://github.com/matter-in-motion/mm/blob/master/docs/settings.md)
* [Extensions](https://github.com/matter-in-motion/mm/blob/master/docs/extensions.md)
* [Transports](https://github.com/matter-in-motion/mm/blob/master/docs/transports.md)
  - HTTP
  - WebSockets
  - MQTT (in progress)
* [API and Resources](https://github.com/matter-in-motion/mm/blob/master/docs/api.md)
* [Authentication](https://github.com/matter-in-motion/mm/blob/master/docs/authentication.md)
* [Cli](https://github.com/matter-in-motion/mm/blob/master/docs/cli.md)
* [Errors codes](https://github.com/matter-in-motion/mm-errors)


License: MIT.
