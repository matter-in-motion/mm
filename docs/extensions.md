# Matter In Motion. Extensions

Extensions are the easy way to add features to the Matter In Motion app.

## Usage

1. `npm i <extension>`
2. Add the extension to extensions list in your settings

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

## Writing your extension

Extensions could be very different; they can add resources, transports, or any other features. As an example, you can check any extensions from [GitHub](https://github.com/matter-in-motion)

### Api

1. **Naming convention: name your npm packages like `mm-<extension>`**
2. Use comprehend namespace for your module inside the application:
  - `db` — for database connectors
  - `templates` — for templates engines
  - `transports` — for transports
  - `commands` — to add custom CLI commands
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
This creates the `transports.http` unit.

Or as in [nunjucks-extensions](https://github.com/matter-in-motion/mm-nunjucks-extensions):

```js
'use strict';

module.exports = function() {
  // this here is your App instance
  const settings = this.units.require('core.settings').require('nunjucks').extensions;

  const env = this.units.require('templates.nunjucks');

  settings.forEach(ext => {
    if (typeof ext === 'string') {
      ext = this.require(ext);
    }

    const extension = new ext();
    const name = extension.tags[0];
    env.addExtension(name, extension);
  });
}
```

Doesn't add any new units but extends the existing unit.

### Custom commands

To add a CLI commands to the application, you need to export commands declarations from the extension:

```js
'use strict';
module.exports = {
  commands: {
    user: {
      __expose: true,
      create: {
        description: '<user> <password>. Creates a new user',
        call: function(name, password) {
          //this is the app instance
          //so you have access to all the units
          return this.units
            .require('resources.user.controller')
            .create(name, password);
        }
      },
    }
  }
};
```

* **namespace** — here is the `user`. Give us a namespace for all commands
  - **__expose** — this is a `units` directive to expose this object as it is and not as a unit
  - **__extend** — this is a `units` directive to extend existent commands namespace declaration (for example from an extension)
  - **name** — here is a `create`. Command name
    + **description** — command help string.
    + **call** — command function. Context (`this`) of this function is bound to the application instance.

To use the command declared above:

`bin/mm user create John password`

