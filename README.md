# Matter In Motion

## Micro service framework and protocol with the focus on real-time applications, blazing response time and low memory footprint.

### Features
* **~100ms** startup time for simpe demo application worker
* **Under 1s** startup time for real world application cluster with 8 workers
* **Secure** built in authtorisation with cryptographic passwords hashing [bcrypt](https://github.com/ncb000gt/node.bcrypt.js), [JSON Web Tokens](https://jwt.io) ([RFC 7519](https://tools.ietf.org/html/rfc7519)) encoding/decoding
* **Simple modular architecture to build complex RPC APIs** code base in production since 2013
* **Request and response data validation** using declarative style api and JSON Schema validator ([ajv](https://github.com/epoberezkin/ajv))
* **Built-in api auto discovery**

## Usage

1. [Getting started](https://github.com/matter-in-motion/mm/blob/master/docs/getting-started.md) — a tutorial with all the steps to make application from scratch and explanations of framework's architecture
2. Clone the [demo application](https://github.com/matter-in-motion/demo).

## Content

* [Units](https://github.com/matter-in-motion/mm/blob/master/docs/units.md)
* [Protocol](https://github.com/matter-in-motion/mm/blob/master/docs/protocol.md)
* [Settings](https://github.com/matter-in-motion/mm/blob/master/docs/settings.md)
* [Transports](https://github.com/matter-in-motion/mm/blob/master/docs/transports.md)
  - http
  - websockets
  - mqtt (in progress)
* [API and Resources](https://github.com/matter-in-motion/mm/blob/master/docs/api.md)
* [Authentication](https://github.com/matter-in-motion/mm/blob/master/docs/authetication.md)
* [Cli](https://github.com/matter-in-motion/mm/blob/master/docs/cli.md)
* [Sweets](https://github.com/swts/sweets)


License: MIT.
