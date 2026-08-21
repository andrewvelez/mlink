# JSDoc Cheat Sheet for JavaScript

Standard JSDoc annotations using JavaScript native types only.

## File documentation

```js
/**
 * @file Utility functions for native JavaScript values.
 * @summary Native JavaScript JSDoc examples.
 * @author Andrew Velez
 * @version 1.0.0
 * @since 2026-07-07
 * @copyright Andrew Velez 2026
 * @license MIT
 * @todo Add more examples.
 * @see formatText
 * @module native-values
 */
```

## Primitive types

```js
/** @type {string} */
const stringValue = "text";

/** @type {number} */
const numberValue = 42;

/** @type {bigint} */
const bigintValue = 42n;

/** @type {boolean} */
const booleanValue = true;

/** @type {symbol} */
const symbolValue = Symbol("id");

/** @type {undefined} */
const undefinedValue = undefined;

/** @type {null} */
const nullValue = null;
```

## General type expressions

```js
/** @type {*} */
let anyValue;

/** @type {?} */
let unknownValue;

/** @type {(string|number)} */
let unionValue = "text";

/** @type {?string} */
let nullableString = null;

/** @type {!Object} */
const nonNullObject = {};

/** @type {(string|undefined)} */
let optionalString;

/** @type {number[]} */
const numbers = [1, 2, 3];

/** @type {Array.<string>} */
const strings = ["a", "b"];

/** @type {{name: string, count: number}} */
const item = { name: "example", count: 1 };

/** @type {Object.<string, number>} */
const scores = { alice: 10, bob: 20 };

/** @type {Function} */
const genericFunction = () => undefined;

/** @type {function(string): number} */
const getLength = (value) => value.length;

/** @type {function(number, number): number} */
const add = (left, right) => left + right;

/** @type {function(...number): number} */
const sum = (...values) => values.reduce((total, value) => total + value, 0);
```

## Type assertion

```js
const parsedValue = /** @type {number} */ (JSON.parse("42"));
```

## Native built-in objects

```js
/** @type {Object} */
const objectValue = {};

/** @type {Date} */
const dateValue = new Date();

/** @type {RegExp} */
const regexpValue = /example/u;

/** @type {Error} */
const errorValue = new Error("Example");

/** @type {AggregateError} */
const aggregateErrorValue = new AggregateError([], "Multiple errors");

/** @type {EvalError} */
const evalErrorValue = new EvalError("Example");

/** @type {RangeError} */
const rangeErrorValue = new RangeError("Out of range");

/** @type {ReferenceError} */
const referenceErrorValue = new ReferenceError("Unknown name");

/** @type {SyntaxError} */
const syntaxErrorValue = new SyntaxError("Invalid syntax");

/** @type {TypeError} */
const typeErrorValue = new TypeError("Invalid type");

/** @type {URIError} */
const uriErrorValue = new URIError("Invalid URI");
```

## Collections and promises

```js
/** @type {Map.<string, number>} */
const mapValue = new Map([["one", 1]]);

/** @type {Set.<string>} */
const setValue = new Set(["a", "b"]);

/** @type {WeakMap.<Object, number>} */
const weakMapValue = new WeakMap();

/** @type {WeakSet.<Object>} */
const weakSetValue = new WeakSet();

/** @type {Promise.<string>} */
const promiseValue = Promise.resolve("complete");
```

## Binary data and typed arrays

```js
/** @type {ArrayBuffer} */
const arrayBufferValue = new ArrayBuffer(16);

/** @type {SharedArrayBuffer} */
const sharedArrayBufferValue = new SharedArrayBuffer(16);

/** @type {DataView} */
const dataViewValue = new DataView(arrayBufferValue);

/** @type {Int8Array} */
const int8Values = new Int8Array(4);

/** @type {Uint8Array} */
const uint8Values = new Uint8Array(4);

/** @type {Uint8ClampedArray} */
const clampedValues = new Uint8ClampedArray(4);

/** @type {Int16Array} */
const int16Values = new Int16Array(4);

/** @type {Uint16Array} */
const uint16Values = new Uint16Array(4);

/** @type {Int32Array} */
const int32Values = new Int32Array(4);

/** @type {Uint32Array} */
const uint32Values = new Uint32Array(4);

/** @type {Float32Array} */
const float32Values = new Float32Array(4);

/** @type {Float64Array} */
const float64Values = new Float64Array(4);

/** @type {BigInt64Array} */
const bigint64Values = new BigInt64Array(4);

/** @type {BigUint64Array} */
const bigUint64Values = new BigUint64Array(4);
```

## Weak references and internationalization

```js
/** @type {WeakRef.<Object>} */
const weakReference = new WeakRef({});

/** @type {FinalizationRegistry.<string>} */
const registry = new FinalizationRegistry((description) => {
  console.log(description);
});

/** @type {Intl.Collator} */
const collator = new Intl.Collator("en-US");

/** @type {Intl.DateTimeFormat} */
const dateFormatter = new Intl.DateTimeFormat("en-US");

/** @type {Intl.DisplayNames} */
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

/** @type {Intl.ListFormat} */
const listFormatter = new Intl.ListFormat("en-US");

/** @type {Intl.Locale} */
const locale = new Intl.Locale("en-US");

/** @type {Intl.NumberFormat} */
const numberFormatter = new Intl.NumberFormat("en-US");

/** @type {Intl.PluralRules} */
const pluralRules = new Intl.PluralRules("en-US");

/** @type {Intl.RelativeTimeFormat} */
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en-US");

/** @type {Intl.Segmenter} */
const segmenter = new Intl.Segmenter("en-US");
```

## Parameters and return values

```js
/**
 * @param {string} text Required parameter.
 * @param {number} [repeatCount] Optional parameter.
 * @param {boolean} [uppercase=false] Optional parameter with default.
 * @param {...string} suffixes Rest parameter.
 * @returns {string} Formatted text.
 * @throws {RangeError} If repeatCount is negative.
 */
function formatText(text, repeatCount = 1, uppercase = false, ...suffixes) {
  if (repeatCount < 0) {
    throw new RangeError("repeatCount must not be negative");
  }

  const result = text.repeat(repeatCount) + suffixes.join("");
  return uppercase ? result.toUpperCase() : result;
}
```

Aliases:

```text
@param      @arg       @argument
@returns    @return
@throws     @exception
```

## Object parameters

```js
/**
 * @param {Object} options
 * @param {string} options.name
 * @param {number} [options.count=0]
 * @param {boolean} [options.enabled=true]
 * @returns {string}
 */
function describeOptions(options) {
  return [options.name, options.count ?? 0, options.enabled ?? true].join(":");
}
```

## Callback

```js
/**
 * @callback NumberPredicate
 * @param {number} value
 * @param {number} index
 * @returns {boolean}
 */

/**
 * @param {number[]} values
 * @param {NumberPredicate} predicate
 * @returns {number[]}
 */
function selectNumbers(values, predicate) {
  return values.filter(predicate);
}
```

## Typedefs and properties

```js
/**
 * @typedef {(string|number)} StringOrNumber
 */

/**
 * @typedef {Object} ItemRecord
 * @property {string} name
 * @property {number} count
 * @property {boolean} [enabled]
 * @property {Date} [createdAt]
 */

/** @type {ItemRecord} */
const record = {
  name: "example",
  count: 1,
};
```

Alias:

```text
@property    @prop
```

## Constants, defaults, and enums

```js
/**
 * @constant {number}
 * @default 3
 */
const MAX_ATTEMPTS = 3;

/**
 * @enum {string}
 */
const Direction = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
};
```

Aliases:

```text
@constant     @const
@default      @defaultvalue
```

## Classes and constructors

```js
/**
 * Represents a point.
 *
 * @class
 * @param {number} x
 * @param {number} y
 */
function Point(x, y) {
  /** @type {number} */
  this.x = x;

  /** @type {number} */
  this.y = y;
}

/**
 * @returns {number}
 */
Point.prototype.magnitude = function () {
  return Math.hypot(this.x, this.y);
};
```

Alias:

```text
@constructor
```

## Class description and constructor control

```js
/**
 * @classdesc Represents a counter.
 */
class Counter {
  constructor() {
    /** @public @type {number} */
    this.value = 0;

    /** @protected @type {number} */
    this.step = 1;

    /** @private @readonly @type {Date} */
    this.createdAt = new Date();
  }
}

/**
 * @hideconstructor
 */
class StaticUtilities {}
```

## Inheritance and implementation

```js
/**
 * @augments Error
 */
class ValidationError extends Error {}

/**
 * @extends Counter
 */
class ResettableCounter extends Counter {
  /** @override */
  reset() {
    this.value = 0;
  }
}

/**
 * @interface
 */
function Serializable() {}

/**
 * @returns {string}
 */
Serializable.prototype.serialize = function () {};

/**
 * @implements {Serializable}
 */
class SerializableValue {
  /**
   * @returns {string}
   */
  serialize() {
    return "serialized";
  }
}
```

Related tags:

```text
@abstract     @virtual
@augments     @extends
@implements
@inheritdoc
@override
```

## Generators and iterators

```js
/**
 * @generator
 * @param {number} limit
 * @yields {number}
 */
function* createNumbers(limit) {
  for (let value = 0; value < limit; value += 1) {
    yield value;
  }
}

/** @type {Iterable.<number>} */
const iterableValue = [1, 2, 3];

/** @type {Iterator.<number>} */
const iteratorValue = [1, 2, 3].values();

/** @type {Generator.<number, void, undefined>} */
const generatorValue = createNumbers(3);
```

Alias:

```text
@yields    @yield
```

## Function and member classification

```js
/**
 * @function calculateTotal
 * @param {number[]} values
 * @returns {number}
 */
const calculateTotal = (values) => values.reduce((total, value) => total + value, 0);

/**
 * @member {number}
 */
const currentValue = 1;

/**
 * @namespace
 */
const Utilities = {};

/**
 * @memberof Utilities
 * @static
 * @type {number}
 */
const maximum = 100;
```

Aliases:

```text
@function    @func    @method
@member      @var
```

## Modules and namespaces

```js
/**
 * @module native-values
 * @requires module:other-module
 */

/**
 * @namespace Application.Utilities
 */
const Utilities = {};
```

Related tags:

```text
@module
@exports
@requires
@namespace
@memberof
@lends
```

## Scope and access

```js
/**
 * @global
 */
function globalFunction() {}

/**
 * @inner
 */
function innerFunction() {}

/**
 * @instance
 */
function instanceFunction() {}

/**
 * @static
 */
function staticFunction() {}

/**
 * @access public
 */
function publicFunction() {}

/**
 * @access protected
 */
function protectedFunction() {}

/**
 * @access private
 */
function privateFunction() {}

/**
 * @access package
 */
function packageFunction() {}
```

Direct access tags:

```text
@public
@protected
@private
@package
```

## Mixins and borrowed members

```js
/**
 * @mixin
 */
const SerializableMixin = {
  /**
   * @returns {string}
   */
  serialize() {
    return JSON.stringify(this);
  },
};

/**
 * @mixes SerializableMixin
 */
class RecordValue {}

/**
 * @borrows Utilities.format as format
 */
const Formatter = {};
```

## External symbols

```js
/**
 * @external JSON
 */
```

Alias:

```text
@host
```

## Events

```js
/**
 * @event Counter#change
 * @type {Object}
 * @property {number} previousValue
 * @property {number} currentValue
 */

/**
 * @fires Counter#change
 */
function increment() {}

/**
 * @listens Counter#change
 */
function updateDisplay() {}
```

Alias:

```text
@fires    @emits
```

## Descriptions and examples

```js
/**
 * Adds two numbers.
 *
 * @summary Adds numeric values.
 * @description Returns the sum of two numbers.
 * @param {number} left
 * @param {number} right
 * @returns {number}
 *
 * @example
 * add(2, 3);
 * // 5
 */
function add(left, right) {
  return left + right;
}
```

Alias:

```text
@description    @desc
```

## References and status

```js
/**
 * @see formatText
 * @see {@link formatText}
 * @see {@link formatText|Formatting documentation}
 * @tutorial getting-started
 * @todo Add validation.
 * @deprecated Since version 2.0. Use formatText instead.
 * @since 1.2.0
 * @version 2.1.0
 * @author Andrew Velez
 * @copyright Andrew Velez 2026
 * @license MIT
 */
```

## Documentation control

```js
/**
 * @ignore
 */
function internalFunction() {}

/**
 * @name virtualFunction
 * @kind function
 * @alias Utilities.virtualFunction
 * @variation 1
 */
```

## Inline tags

```js
/**
 * See {@link formatText}.
 * Call {@linkcode formatText}.
 * Read about {@linkplain formatText the formatter}.
 * Follow {@tutorial getting-started}.
 */
```

## Complete standard JSDoc tag index

```text
@abstract
@access
@alias
@async
@augments
@author
@borrows
@callback
@class
@classdesc
@constant
@constructs
@copyright
@default
@deprecated
@description
@enum
@event
@example
@exports
@external
@file
@fires
@function
@generator
@global
@hideconstructor
@ignore
@implements
@inheritdoc
@inner
@instance
@interface
@kind
@lends
@license
@listens
@member
@memberof
@mixes
@mixin
@module
@name
@namespace
@override
@package
@param
@private
@property
@protected
@public
@readonly
@requires
@returns
@see
@since
@static
@summary
@this
@throws
@todo
@tutorial
@type
@typedef
@variation
@version
@yields
```

Common aliases:

```text
@arg            @argument       → @param
@const                          → @constant
@constructor                    → @class
@defaultvalue                   → @default
@desc                           → @description
@emits                          → @fires
@exception                      → @throws
@extends                        → @augments
@fileoverview    @overview      → @file
@func            @method        → @function
@host                           → @external
@prop                           → @property
@return                         → @returns
@var                            → @member
@virtual                        → @abstract
@yield                          → @yields
```
