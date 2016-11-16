'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var GET_OWN_SYMBOLS_AVAILABLE = typeof Object.getOwnPropertySymbols === 'function';

var KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true
};

var hoistStatics = function hoistStatics(target, source) {
  return Object.getOwnPropertyNames(source).concat(GET_OWN_SYMBOLS_AVAILABLE ? Object.getOwnPropertySymbols(source) : []).filter(function (key) {
    return !KNOWN_STATICS[key];
  }).reduce(function (target, key) {
    return Object.assign(target, _defineProperty({}, key, source[key]));
  }, target);
};

var parseInjectionMap = exports.parseInjectionMap = function parseInjectionMap(map) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return Object.keys(map).reduce(function (map, key) {
    return Object.assign({}, map, _defineProperty({}, key, typeof map[key] === 'function' ? map[key].apply(null, args) : map[key]));
  }, map);
};

var inject = exports.inject = function inject() {
  var injectionMap = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return function (WrappedClass) {
    function InjectDecoratedClass() {
      var depMap = parseInjectionMap(InjectDecoratedClass.injectionMap, arguments);
      var parsedArguments = Array.prototype.concat.call([depMap], Array.prototype.slice.call(arguments));
      return new (Function.prototype.bind.apply(InjectDecoratedClass.wrappedClass, [null].concat(_toConsumableArray(parsedArguments))))();
    }

    InjectDecoratedClass.withDependencies = function () {
      var args = Array.prototype.slice.call(arguments, 1) || [];
      var depMap = parseInjectionMap(arguments[0], args);
      var parsedArguments = Array.prototype.concat.call([depMap], Array.prototype.slice.call(args));
      return new (Function.prototype.bind.apply(InjectDecoratedClass.wrappedClass, [null].concat(_toConsumableArray(parsedArguments))))();
    };

    InjectDecoratedClass.injectionMap = injectionMap;
    InjectDecoratedClass.wrappedClass = WrappedClass;

    return hoistStatics(InjectDecoratedClass, WrappedClass);
  };
};
//# sourceMappingURL=index.js.map