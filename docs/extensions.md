# Matter In Motion. Extensions

Extensions are the easy way to add features to the Matter In Motion app.

## Usage

1. `npm i <extension>`
2. Add extension into extensions list in your settings

```js
Settings.prototype.init = function() {
  Settings.super_.prototype.init.call(this);

  this.extensions = [
    'http',
    'websockets',
    'nunjucks',
    'rethinkdb',
    'user'
  ];
}
```

3. Add extension settings

## Writing your own extension

Extensions could be very different, they can add resources, transports, or any other features. As example you can check any extensions from [GitHub](https://github.com/matter-in-motion)

### Api

1. **Naming convention is to name your npm packages as `mm-<extension>`**
2. Use comprehend namespace for your module inside the application:
  - `db` — for database connectors
  - `templates` — for templates engines
  - `transports` — for transports
  - `commands` — to add custom cli commands
  - `resources` — to add resources
3. The main file of your extension package may return units tree you want to add to the application

For example as [HTTP transport extension](https://github.com/matter-in-motion/mm-http):

```js
'use strict';
const Http = require('./http');

module.exports = () => ({
  transports: { http: new Http() }
});
```

This will create a `transports.http` unit.

Or as [nunjucks-cachebust](https://github.com/matter-in-motion/mm-nunjucks-cachebust):

```js
'use strict';
const CacheBust = require('./tags/cachebust');

module.exports = units => {
  const env = units.require('templates.nunjucks');
  env.addExtension('cachebust', new CacheBust());
}
```

Doesn't add any new units but extends existing unit.

### Custom commands

To add a custom cli commnad from your extension you have to export commands declarations from it. It looks like this:

```js
'use strict';
module.exports = {
  commands: {
    user: {
      __expose: true,
      create: {
        description: '<user> <password>. Creates a new user',
        call: (name, password, cb) => {
          //this is the app instance
          //so you have access to all the units
          const ctrl = this.units.require('resources.user.controller');
          ctrl.create(name, password, cb);
        }
      },
    }
  }
};
```

* **namespace** — here is the `user`. Give us a name space for all commands
  - **__expose** — this is a special units derective to expose this object as it is and not like a unit
  - **name** — here is a `create`. Command name
    + **description** — command help string.
    + **call** — command function. `this` is the application instance.

To use the command declared above:

`bin/mm user create John password`



