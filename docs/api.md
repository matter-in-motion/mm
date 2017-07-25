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

This class is a resource API description. It is optional, means that resources without API unit will not be available from the API. You can define as many methods as you want.

```js
'use strict';

const Api = function() {
  //here we expose api methods
  this.calls = [ 'hello' ];
}

Api.prototype.__init = function(units) {
  this.ctrl = units.require('controller');
};

Api.prototype.hello = function() {
  return {
    title: 'World',
    description: 'Say hello to the world!',
    auth: {
      provider: 'user',
      required: true
    },
    raw: false,
    request: { type: 'string' },
    response: { type: 'string' },
    call: (auth, data, cb) => this.ctrl.hello(data, cb)
  };
};

module.exports = Api;
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
const Api = require('./api');
const Controller = require('./controller');

module.exports = () => {
  return {
    controller: new Controller(),
    api: new Api()
  };
};
```

### resources/units.js
```js
'use strict';
const resource1 = require('./resource1/units');
const resource2 = require('./resource2/units');
module.exports = { resource1, resource2 };
```

## Usage

To make your resources available in your app call `addResources` in `willStart` method of the app

```js
'use strict';
const fs = require('fs');
const MMApp = require('matter-in-motion').App;

const App = function(options) {
  MMApp.call(this, options);
};
inherits(App, MMApp);

App.prototype.willStart = function() {
  this.addResources();
};

module.exports = App;
```


