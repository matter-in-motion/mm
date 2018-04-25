# Matter In Motion. Protocol

## Protocol

Matter in motion protocol designed to be simple and work with RPC requests and responses as well as with events delivery.

### Message

The smallest data packet is called message. It consists of 4 parts.

* __call__ — RPC request call name, RPC response error or event name.
* __body__ — payload for the above.
* __meta__ — metadata, usually has an authentication token.
* __id__ — id of the RPC request, always returned with the response.

In the code it looks like the simple array:

```js
const msg = [ 'world.hello', {name: 'John'}, 'authToken', 1 ];
```

A message can omit empty fields

```js
const msg = [ 'world.hello', {name: 'John'} ];
```

Responses to this request could be

```js
const msg = [ '', 'Hello John' ];
```

Or an error

```js
const msg = [ { code: 4100, message: 'Unauthorized'} ];
```

[Matter in motion errors codes](https://github.com/matter-in-motion/mm-errors)

**Important: every transport layer treats messages differently to use all advantages of the transport itself. Check the [transports](https://github.com/matter-in-motion/mm/blob/master/docs/transports.md)**
