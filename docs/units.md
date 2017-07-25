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


