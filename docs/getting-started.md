# Matter In Motion. Getting started

## Installation

1. The usual `npm i matter-in-motion`
2. Create a link to the bin `mkdir bin && cd bin && ln -s ../node_modules/matter-in-motion/bin/mm mm && cd ..`

## Getting started

What's next? Let's make a simple 'Hello world' app:

1. Create `lib/app.js` with this content:

```js
'use strict';
const inherits = require('util').inherits;
const MMApp = require('matter-in-motion').App;

const App = function(options) {
  MMApp.call(this, options);
};
inherits(App, MMApp);

module.exports = App;
```

Why just created our App class inherited from the Matter In Motion App class

2. Matter in motion is a modular framework. And it is transport agnostic. So for a next step, you have to choose what transport you are going to use:
  - http
  - websockets

Let's you choose HTTP for a beginning. To make this you need to create a settings file:

`npm i mm-http`

`lib/settings/index.js`

```js
'use strict';
const inherits = require('util').inherits;
const MMSettings = require('matter-in-motion').Settings;

const Settings = function() {
  MMSettings.call(this);
};
inherits(Settings, MMSettings);

Settings.prototype.init = function() {
  Settings.super_.prototype.init.call(this);

  this.extensions = [
    'http'
  ]

  this.http: {
    port: 3000,
    host: '0.0.0.0'
  };
};

module.exports = Settings;
```

We just add minimal configuration to put the matter in motion by HTTP 🙂. You can see all other available HTTP settings check [http module](https://github.com/matter-in-motion/mm-http) documentation

This is gonna be your default settings file. Settings system is very flexible. To find more information about all the settings see [settings](https://github.com/matter-in-motion/mm/blob/master/docs/settings.md) chapter.

3. Next, we need to serve our index.html. And make a simple resource to call to.

Let's start with the resource.

`mkdir -p lib/resources/world`

Here we need to make `world` API declaration file `api.js`

```js
'use strict';

module.exports = {
  __expose: true,

  hello: function() {
    // returns a method declaration
    // this is a resources controller if exists
    return {
      title: 'World',
      description: 'Say hello to the world!',
      //request validation JSONSchema
      request: { type: 'string' },
      //response validation JSONSchema
      response: { type: 'string' },
      //call function
      call: (auth, data) => this.hello(data)
    }
  }
};
```

And the `controller.js`. Where is all the business happening:

```js
'use strict';

const Controller = function() {};

Controller.prototype.__init = function(units) {
  //units interface
};

Controller.prototype.hello = function(name) {
  return `Hello ${name}!`;
};

module.exports = Controller;
```

Concluded with units export `index.js`:

```js
'use strict';
const api = require('./api');
const Controller = require('./controller');

module.exports = () => ({
  api, controller: new Controller()
});
```

Let's review. We have `lib/resources/world` folder with three files `api.js`, `controller.js` and `index.js`. It is your first resource! Congratulations!

Now we need to export `world` resource. Create a `lib/resources/index.js`

```js
'use strict';
const world = require('./world');
module.exports = { world };
```

This is done! Next is frontend part. Create a `templates/index.html`. Here we created a simple `POST` request and parse the response. You should be familiar with plain JavaScript in the browser. You may want to read more about [matter in motion protocol](https://github.com/matter-in-motion/mm/blob/master/docs/protocol.md) and [http transport](https://github.com/matter-in-motion/mm-http) later.

```html
<!DOCTYPE html>
<html>
  <body>
    <input id="input" type="text" placeholder="Name">
    <button id="button">Hello world</button><br>
    <textarea name="result" id="result" cols="80" rows="20"></textarea>
  </body>
  <script>
    var result = document.getElementById('result');
    var input = document.getElementById('input');
    var button = document.getElementById('button');
    button.addEventListener('click', function() {
      var name = input.value || '';
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api', true);
      xhr.setRequestHeader('MM', JSON.stringify({ call: 'world.hello' }) );
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(name);
      xhr.onload = function() {
        var res;
        if (xhr.status === 200) {
          var msg = JSON.parse(xhr.responseText);
          //error?
          if (msg[0]) {
            res = msg[0].code + ' ' + msg[0].message;
          } else {
            res = msg[1];
          }
        } else {
          res = xhr.status;
        }

        result.value += res + '\n';
      }
    });
  </script>
</html>

```

To serve our page lets add this to our application:

```js
'use strict';
const fs = require('fs');
const inherits = require('util').inherits;
const MMApp = require('matter-in-motion').App;

const index = fs.readFileSync('templates/index.html');

const App = function(options) {
  MMApp.call(this, options);
};
inherits(App, MMApp);

App.prototype.didStart = function() {
  this.use('/', (req, res) => {
    res.status(200)
    res.set('Content-Type', 'text/html')
    res.send(index);
  });
};

module.exports = App;

```

4. The last one. Just create default directories for logs. `mkdir -p var/{app,log}`.

That's it! We a read to have our first call. Run application `bin/mm worker` and go to [http://localhost:3000](http://localhost:3000) and try it yourself.

Hooray!



