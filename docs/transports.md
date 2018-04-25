# Matter In Motion. Transports

Transports layer is an abstraction between a network and [matter in motion protocol](https://github.com/matter-in-motion/mm/blob/master/docs/protocol.md)

To use [API](https://github.com/matter-in-motion/mm/blob/master/docs/api.md) you should define at least one transport:

* __[http](https://github.com/matter-in-motion/mm-http)__
* __[websockets](https://github.com/matter-in-motion/mm-websockets)__

Install transport extension as any other Matter in Motion extension:

1. `npm i <extension>`
2. Add the extension to extensions list in your settings
3. Add extension settings

__You can use multiple transports at once.__
