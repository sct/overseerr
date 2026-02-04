import { withProperties } from '@app/utils/typeHelpers';
import { describe, expect, it } from 'vitest';

describe('withProperties', () => {
  it('should add properties to a component object', () => {
    const component = { name: 'Button' };
    const properties = { variant: 'primary', size: 'large' };

    const result = withProperties(component, properties);

    expect(result.name).toBe('Button');
    expect(result.variant).toBe('primary');
    expect(result.size).toBe('large');
  });

  it('should return the same object reference (mutates original)', () => {
    const component = { name: 'Button' };
    const properties = { variant: 'primary' };

    const result = withProperties(component, properties);

    expect(result).toBe(component);
  });

  it('should work with function components', () => {
    const Component = () => null;
    const properties = { displayName: 'MyComponent', defaultProps: {} };

    const result = withProperties(Component, properties);

    expect(result.displayName).toBe('MyComponent');
    expect(result.defaultProps).toEqual({});
    expect(typeof result).toBe('function');
  });

  it('should handle empty properties object', () => {
    const component = { name: 'Button' };
    const properties = {};

    const result = withProperties(component, properties);

    expect(result).toEqual({ name: 'Button' });
  });

  it('should override existing properties', () => {
    const component = { name: 'Button', variant: 'secondary' };
    const properties = { variant: 'primary' };

    const result = withProperties(component, properties);

    expect(result.variant).toBe('primary');
  });

  it('should handle nested objects in properties', () => {
    const component = { name: 'Form' };
    const properties = {
      defaultValues: { email: '', password: '' },
      validation: { required: true },
    };

    const result = withProperties(component, properties);

    expect(result.defaultValues).toEqual({ email: '', password: '' });
    expect(result.validation).toEqual({ required: true });
  });

  it('should handle arrays in properties', () => {
    const component = { name: 'List' };
    const properties = { items: [1, 2, 3], columns: ['a', 'b'] };

    const result = withProperties(component, properties);

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.columns).toEqual(['a', 'b']);
  });

  it('should handle null and undefined values in properties', () => {
    const component = { name: 'Widget' };
    const properties = { optional: null, missing: undefined };

    const result = withProperties(component, properties);

    expect(result.optional).toBeNull();
    expect(result.missing).toBeUndefined();
  });

  it('should preserve type safety with complex types', () => {
    interface ComponentType {
      render: () => void;
    }

    interface PropertiesType {
      displayName: string;
      propTypes: Record<string, unknown>;
    }

    const component: ComponentType = {
      render: () => {
        // Render method placeholder
      },
    };
    const properties: PropertiesType = {
      displayName: 'TestComponent',
      propTypes: { title: { required: true } },
    };

    const result = withProperties(component, properties);

    expect(typeof result.render).toBe('function');
    expect(result.displayName).toBe('TestComponent');
    expect(result.propTypes).toEqual({ title: { required: true } });
  });

  describe('real-world scenarios', () => {
    it('should work with React component-like objects', () => {
      const Component = function TestComponent() {
        return null;
      };

      const SubComponent1 = function Sub1() {
        return null;
      };
      const SubComponent2 = function Sub2() {
        return null;
      };

      const result = withProperties(Component, {
        Sub1: SubComponent1,
        Sub2: SubComponent2,
        displayName: 'TestComponent',
      });

      expect(result.Sub1).toBe(SubComponent1);
      expect(result.Sub2).toBe(SubComponent2);
      expect(result.displayName).toBe('TestComponent');
    });

    it('should handle multiple withProperties calls', () => {
      const component = { name: 'Base' };
      const props1 = { variant: 'primary' };
      const props2 = { size: 'large' };

      const result1 = withProperties(component, props1);
      const result2 = withProperties(result1, props2);

      expect(result2.name).toBe('Base');
      expect(result2.variant).toBe('primary');
      expect(result2.size).toBe('large');
    });
  });
});
