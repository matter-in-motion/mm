# Matter In Motion. API and Resources

Before you start, make sure you did not miss the [units](https://github.com/matter-in-motion/mm/blob/master/docs/units.md) part.

## API

You can call any method of any resource as simple as `world.hello` or `user.auth.verify`.

### Autodiscovery

If you add `?` to the end of the call, API returns:

* For the API itself (ex: `?`) — list of available resources
* For resource (ex: `user?`) — list of available methods
* For resource method (ex: `user.get?`) — schema with title, description, auth, request, and response schemas

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
    index.js
  /resource2
    api.js
    controller.js
    index.js
  index.js
```

### api.js

This file is a declaration of the resource API. It is optional, means that resources without API unit are not available to the API calls. You can define as many methods as you want.

```js
'use strict';

module.exports = {
  __expose: true,

  hello: function(app) {
    // this is bound to resource controller is available
    // the app is an instance of your app
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
  - provider — auth provider that should be used to verify request meta. If provider not found or not active returns `ProviderNotFound` error. Default provider can also be defined in the settings `auth` section as `default: 'user'`
  - __required__ — true, false, 'optional'. Defines should API return an error if meta is not verified. If true and failed to verify meta returns an `Unauthorized` error
* __raw__ — default false. If `true`, passes a raw message object to parse request manually. When `true` requires validating incoming data manually
* __request__ — request validation JSON schema. If validation fails returns the `RequestValidation` error
* __response__ — response validation JSON Schema. If validation fails returns the `ResponseValidation` error
* __call__ — API call function. The context of this function bound to Application instance.

`call` function signature when `raw` option is false (default)
`call: (auth, data [, cb])`

* __auth__ — is the token data
* __data__ — is the __validated__ request data

`call` function signature when `raw` option is true
`call: (auth, msg [, cb])`

* __auth__ — is the token data
* __msg__ — is the message object

*Only `request` and `call` required for API method definition.*

### controller.js

A simple unit you can do whatever you want here

### index.js

Resource definition unit.

```js
'use strict';
const api = require('./api');
const Controller = require('./controller');

module.exports = () => ({
  api, controller: new Controller()
});
```

### resources/index.js
```js
'use strict';
const resource1 = require('./resource1');
const resource2 = require('./resource2');
module.exports = { resource1, resource2 };
```

## Usage

All resources are available in your application in the `resources` unit.
