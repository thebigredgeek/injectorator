const GET_OWN_SYMBOLS_AVAILABLE = typeof Object.getOwnPropertySymbols === 'function';

const KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true
};

const hoistStatics = (target, source) => Object
  .getOwnPropertyNames(source)
  .concat(GET_OWN_SYMBOLS_AVAILABLE ? Object.getOwnPropertySymbols(source) : [])
  .filter((key) => !KNOWN_STATICS[key])
  .reduce((target, key) => Object.assign(target, {
    [key]: source[key]
  }), target);

export const parseInjectionMap = (map, args = []) => Object
  .keys(map)
  .reduce((map, key) => Object.assign({},
    map, {
      [key]: typeof map[key] === 'function' ? map[key].apply(null, args) : map[key]
    }
  ), map);

export const inject = (injectionMap = {}) => WrappedClass => {
  function InjectDecoratedClass () {
    const depMap = parseInjectionMap(InjectDecoratedClass.injectionMap, arguments);
    const parsedArguments = Array.prototype.concat.call([depMap], Array.prototype.slice.call(arguments));
    return new InjectDecoratedClass.wrappedClass(...parsedArguments);
  }

  InjectDecoratedClass.withDependencies = function () {
    const args = Array.prototype.slice.call(arguments, 1) || [];
    const depMap = parseInjectionMap(arguments[0], args);
    const parsedArguments = Array.prototype.concat.call([depMap], Array.prototype.slice.call(args));
    return new InjectDecoratedClass.wrappedClass(...parsedArguments);
  };

  InjectDecoratedClass.injectionMap = injectionMap;
  InjectDecoratedClass.wrappedClass = WrappedClass;

  return hoistStatics(InjectDecoratedClass, WrappedClass);
}
