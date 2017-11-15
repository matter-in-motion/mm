# Matter In Motion. API and Resources

Before you start make sure you didn't miss the [units](https://github.com/matter-in-motion/mm/blob/master/docs/units.md) part.

## API

You can call any method of any resource as simple as `world.hello` or `user.auth.verify`.

### Autodiscovery

If you add `?` to the end of the call API will return:

* For the API itself (ex: `?`) — list of available resources
* For resource (ex: `user?`) — list of available methods
* For resource method (ex: `user.get?`) — schema with title, description, auth, request, and response

## Validation

For request and response validations matter in motion uses [Ajv](https://github.com/epoberezkin/ajv) The fastest JSON-Schema Validator.

To read more about [JSON-Schema](http://json-schema.org)

## Units

Usual units structure of the resource inside `lib/resources` folder

```
/resources
  /resource1
    api.js
    controller.js
    units.js
  /resource2
    api.js
    controller.js
    units.js
  units.js
```

### api.js

This is a declaration of the resource API. It is optional, means that resources without API unit will not be available from the API. You can define as many methods as you want.

```js
'use strict';

module.exports = {
  __expose: true,

  hello: function(app) {
    // this is binded to resource controller is avaliable
    // app is an instance of your app
    return {
      title: 'World',
      description: 'Say hello to the world!',
      //request validation JSONSchema
      request: { type: 'string' },
      //response validation JSONSchema
      response: { type: 'string' },
      //call function
      call: function(auth, data) => {
        // this is binded to the app instance
        return 'Hello' + data;
      }
    }
  }
};
```

#### Schema

* __title__ — title of the resource method
* __description__ — description of the resource method
* __auth__
  - __provider__ — auth provider that should be used to verify request meta. If provider not found or not active returns `ProviderNotFound` error
  - __required__ — true, false, 'optional'. defines should API return an error if meta isn't verified. If true and failed to verify meta returns an `Unauthorized` error
* __raw__ — default false. Defines if you need a raw connection to parse request manually. This requires to validate incoming data manually
* __request__ — JSON Schema that request should be validated against. If not returns `RequestValidation` error
* __response__ — JSON Schema that response should be validated against. If not returns `ResponseValidation` error
* __call__ — actual API call function.

if the request is raw then call looks like this:
`call: (incomingConnection, auth, data, cb)`

If not:
`call: (auth, data, cb)`

* __auth__ — is the token data
* __data__ — is the __validated__ request data

Only `request` and `call` required for API method definition.

### controller.js

Simple unit you can do whatever you want here

### units.js

```js
'use strict';
const api = require('./api');
const Controller = require('./controller');

module.exports = () => ({
  api, controller: new Controller()
});
```

### resources/units.js
```js
'use strict';
const resource1 = require('./resource1/units');
const resource2 = require('./resource2/units');
module.exports = { resource1, resource2 };
```

## Usage

Your resources will be available in your app in the `resources` unit.
