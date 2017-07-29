# Matter In Motion. Units

Units is a simple way to have definable namespaces and two step initialization

## Unit

Unit is simple interface

```js
const Controller = function () {
  this.db = undefined;
};

Controller.prototype.__init = function (units) {
  // all units are instantiated at this point
  // getting components we're depended on
  // here we can have estabileshed db connection
  this.db = units.require('db');
};
```

### Interface methods

#### __init
Function, unit initialisation

#### __initRequired
Boolean, means that this unit, when required, will be returned inited

#### __instance
Function, If method present it will be called when a unit is required and it should return what you want to return instead of the unit class itself.

## UnitSet
More info at [units repository](https://github.com/velocityzen/units)

## Usage

Units lets you build very simple, predictable and flexible architecture. Look at the actual resources exmaple:

```
/resources
  /message
    api.js
    controller.js
    units.js
  /user
    api.js
    controller.js
    units.js
units.js
```

With this structure you can easly have references to any of your classes.

To get reference to message controller from message api you can simply:

```js
Api.prototype.__init = function(units) {
  this.ctrl = units.require('controller');
}
```

To get reference to message controller from user controller:

```js
User.prototype.__init = function(units) {
  this.message = units.require('message.controller');
  //or
  this.message = units.require('resources.message.controller');
}
```

To get all the resource from somewhere in the app:

```js
Service.prototype.__init = function(units) {
  const resources = units.require('resources');

  //now you can iterate over resources
  for (name of resources) {
    const resource = resources.require(name);
    //do something with the resource
  }

  //or this way
  resources.forEach((unit, name) => {
    console.log(name);
  });

  //or this way
  resources.match('^(.*)\.api$', (unit, name) => this.addResource(name, unit));
}
```

You can expose any kind of data to the units namepsaces as well. Learn more about it at [units repository](https://github.com/velocityzen/units)

