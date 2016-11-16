import { expect } from 'chai';

import { inject } from '../dist/index';

class FakeClass {
  constructor (dependencies, name) {
    this.dependencies = dependencies;
    this.name = name;
  }
}

class FakeDependency {
  constructor () {

  }
}

describe('inject', () => {
  it('returns an InjectDecoratedClass that contains an injection mapping and reference to the wrapped class', () => {
    const mapping = {
      dep: new FakeDependency(),
      dep2: () => new FakeDependency()
    };
    const InjectDecoratedClass = inject(mapping)(FakeClass);

    expect(InjectDecoratedClass.injectionMap).to.equal(mapping);
    expect(InjectDecoratedClass.wrappedClass).to.equal(FakeClass);
  });
});

describe('InjectDecoratedClass', () => {
  describe('constructor', () => {
    it('returns a new instance of the original class passing the dependency map and parameters', () => {
      const dep1 = new FakeDependency();
      const dep2 = new FakeDependency();
      const mapping = {
        dep: dep1,
        dep2: () => dep2
      };

      const InjectDecoratedClass = inject(mapping)(FakeClass);

      const r = new InjectDecoratedClass('foo');

      expect(r.dependencies.dep).to.equal(dep1);
      expect(r.dependencies.dep2).to.equal(dep2);

      expect(r.name).to.equal('foo');
    });
  });
  describe('withDependencies', () => {
    it('returns a new instance of the original class passing an overriding dependency map and parameters', () => {
      const dep1 = new FakeDependency();
      const dep2 = new FakeDependency();
      const dep3 = new FakeDependency();
      const dep4 = new FakeDependency();
      const mapping = {
        dep: dep1,
        dep2: () => dep2
      };

      const mockMapping = {
        dep: dep3,
        dep2: () => dep4
      };

      const InjectDecoratedClass = inject(mapping)(FakeClass);

      const r = InjectDecoratedClass.withDependencies(mockMapping, 'bar');

      expect(r.dependencies.dep).to.equal(dep3);
      expect(r.dependencies.dep2).to.equal(dep4);

      expect(r.name).to.equal('bar');
    });
  });
});
