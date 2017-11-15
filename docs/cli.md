# Matter In Motion. CLI

## Commands
`bin/mm [options] command`

### Options
**`--env=<envname>`** — load environment settings.

### Command to run the app
* __run__

### Commands to control the app in the daemon mode
* __start__
* __stop__
* __restart__

### Commands useful for developing:
* __worker__ — starts one instance of the app
* __console__ — starts the REPL console with the loaded app

## Custom commands

To add your own custom commands just add a `commands` declaration. It can be a `commands.js` or `commands/index.js` in your app directory.

```js
'use strict';
module.exports = {
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
    }
  }
}
```

* **namespace** — here is the `user`. A name space for all commands
  - **__expose** — this is a special units directive to expose this object as it is and not like a unit
  - **__extend** — this is a special units directive to extend existent commands namespace declaration (for example from an extension)
  - **name** — here is a `create`. Command name
    + **description** — command help string.
    + **call** — command function. `this` is the application instance.

To use the command declared above:

`bin/mm user create John password`
