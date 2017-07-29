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
  - `resources` — for resources obviously
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


