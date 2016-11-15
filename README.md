# Injectorator
Minimial dependency injection library for NodeJS and the Browser

[![NPM](https://nodei.co/npm/injectorator.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/injectorator/)

[![CircleCI](https://circleci.com/gh/thebigredgeek/injectorator.svg?style=shield)](https://circleci.com/gh/thebigredgeek/injectorator/tree/master)

## What is dependency injection (DI) and why would I use it
In it's most minimal form, dependency injection (or DI for short) is a method of passing components their dependencies rather than importing them directly.  More specifically, DI frequently relies on various components of an application specifying what they need in order to run and depending on another component, called an injector, to pass said dependencies to the constructor of each component.  This aids in testing, because the developer can pass in mocked dependencies so long as they implement an identical interface, allowing each component to be thoroughly tested at the unit level.  Beyond testing, DI can also be helpful in passing dynamic dependencies into components at run-time in a way that removes the mental overhead of how to pass in said dependencies and how to couple the dependencies to the consuming software component.

## When to not use DI
As stated above, DI is great at making testing easier in many cases, and can assist at run-time dynamic coupling as well.  That being said, DI isn't a one-size-fits-all paradigm.  If you don't currently have, or anticipate, problems with test fragility and don't need run-time dynamic coupling, or if you have an existing solution to these types of problems that doesn't involve DI and that you believe is scalable, don't sweat it.  **Engineering shouldn't be dogmatic or religious**.

## How does Injectorator work

Injectorator takes a minimalistic approach to dependency injection.  Frameworks like AngularJS and Spring have a robust DI harness that is one-size-fits-all.  This is great when you are working with a framework that provides a pattern for doing almost everything, but is overkill if you want the benefits of DI without all of the configuration boilerplate.

With Injectorator, you simply pass your imported dependencies into a decorator function rather than statically referencing the imports within your class.  If you want to force your class to use different "versions" of your dependencies as test time or even run time, you can construct the class using `Constructor.withDependencies` rather than the `new` keyword against the Constructor.

## How do I use Injectorator

To demonstrate why DI can be helpful, let's first write a dependency:
```javascript
export default class Bar {
  constructor () {

  }
  wakeUp () {

  }
  sayHello () {

  }
}
```

Next, let's build our "test subject" called Foo and couple it to `Bar` in a static manner:

```javascript
import Bar from './bar';

export default class Foo {
  constructor (name, dob) {
    this._bar = new Bar();

    this._name = name;
    this._dob = dob;

    this._bar.wakeUp();
  }
  sayHello () {
    this._bar.sayHello();
  }
}
```

It may not be immediately clear, but this is somewhat difficult to test.  We have to add stubs in our test to mock out the dependencies of `Foo` so that we can test it's functionality independently of `Bar`:

```javascript
import { expect } from 'chai';
import { stub } from 'sinon';

import Foo from './foo';

describe('Foo', () => {
  describe('constructor', () => {
    it('calls Bar#wakeUp once', () => {
      // Untestable! *sadface*
    });
  });
  describe('sayHello', () => {
    it('calls Bar#sayHello once', () => {
      const foo = new Foo();
      // This is fragile because we have coupled our test to a private property!
      // This means that if we treat the property as private when we are developing Foo
      // in the future, we make break it's test.  This defeats the purpose of
      // conventional and/or language supported accessibility in OOP
      stub(foo._bar, 'sayHello');
      foo.sayHello();
      expect(foo._bar.sayHello.calledOnce).to.be.true;
    });
  });
});
```

One thing to notice here is that we cannot test `Foo` constructor at all when it comes to it's interactions with dependencies unless we completely mock out `Bar` before the file containing `Foo` is ever loaded in ANY of our test entries or their dependencies.  This test is also very fragile, because our stubbing requires that we access a private property of Foo.  This makes it difficult to separate the "what" from the "how" in our unit tests.

Let's see how we can make testing easier with DI via Injectorator.  First, we need to re-write `Foo` a little bit:

```javascript
import { inject } from 'injectorator';
import Bar from './bar';

// Using ES7+ decorator syntax
@inject({
  bar: (name, dob) => new Bar() // we receive Foo's exposed constructor parameters here
})
export default class Foo {
  // The first constructor parameter becomes hidden from the outside world and contains a map as defined above
  constructor ({ bar }, name, dob) {
    // bar is an instance of Bar unless we mock it out as shown in the tests below
    this._bar = bar;
    this._name = name;
    this._dob = dob;

    this._bar.wakeUp();
  }
  sayHello () {
    this._bar.sayHello();
  }
}
// Here we see that we only pass name and dob.  Injectables are handled
// internally as the first parameter to the constructor.
const foo = new Foo('Andrew E. Rhyne', '11/07/1986');

...

// We could also use the inject decorator with vanilla ES6 as a higher order function:
export default inject({
  bar: (name, dob) => new Bar() // we receive Foo's exposed constructor parameters here
})(Foo)
```

Next, let's create a mock `Bar` that implements the same interface:

```javascript
import { spy } from 'sinon';
export default class MockBar {
  constructor () {
    this.sayHello = spy();
    this.wakeUp = spy();
  }
}
```

Now, let's re-write our test for `Foo`:

```javascript
import { expect } from 'chai';
import { spy } from 'sinon';

import Foo from './foo';

describe('Foo', () => {
  describe('constructor', () => {
    it('calls Bar#wakeUp once', () => {
      const bar = new MockBar();
      const foo = Foo.withDependencies({
        // If mapped to a function, the function is passed the same public parameters as the constructor of Foo
        // Whatever the function returns in passed into Foo's private dependency map parameter
        bar: (name, dob) => bar
      }, 'Hello World', '01/02/03');
      expect(bar.wakeUp.calledOnce).to.be.true;
    });
  });
  describe('sayHello', () => {
    it('calls Bar#sayHello once', () => {
      const bar = new MockBar();
      const foo = Foo.withDependencies({
        // If mapped to an object, the object itself is passed into Foo's private dependency map parameter
        bar: bar
      }, 'Hello World', '01/02/03');
      foo.sayHello();
      expect(bar.sayHello.calledOnce).to.be.true;
    })
  })
});
```

Here we see how much easier it is to test `Foo`.  We don't need to really think about exposed hooks or properties for stubbing.  We can simply create mock versions of each resource.  Our tests are also completely decoupled from the private implementation details of `Foo` and `Bar`, and are simply testing `Foo` along with it's interaction with the public interface of `Bar`.

## API

### inject (map: Object)(constructor: Function) : InjectDecoratedClass

Decorates a class to implicitly inject values specified by the map object as a hash for the class constructor's first parameter.
Each map entity can be either a simple type (Object, Array, Number, String, etc) or a function.  If a map entity is a function,
the function will be passed all data that is passed to the class constructor and the key of the map entity will resolve to whatever
said function returns.

### InjectDecoratedClass.withDependencies(map: Object, ...args)

Constructs an instance of a decorated class with overriding set of dependencies.  Useful for testing and dynamically linking dependencies at run-time.
