# Matter In Motion. Transports

Transports layer is an abstraction between network and [matter in motion protocol](https://github.com/matter-in-motion/mm/blob/master/docs/protocol.md)

To use [API and resources](https://github.com/matter-in-motion/mm/blob/master/docs/api.md) you should define at least one transport:

* __[http](https://github.com/matter-in-motion/mm-http)__
* __[websockets](https://github.com/matter-in-motion/mm-websockets)__

To install transport module just `npm install` it in your application folder and add transport settings into `core.transports` part. You can define multiple types of transport at once.
