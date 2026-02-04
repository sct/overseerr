import useDebouncedState from '@app/hooks/useDebouncedState';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useDebouncedState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with the provided value', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      const [value, debouncedValue] = result.current;
      expect(value).toBe('initial');
      expect(debouncedValue).toBe('initial');
    });

    it('should initialize with empty string', () => {
      const { result } = renderHook(() => useDebouncedState(''));

      const [value, debouncedValue] = result.current;
      expect(value).toBe('');
      expect(debouncedValue).toBe('');
    });

    it('should initialize with number value', () => {
      const { result } = renderHook(() => useDebouncedState(42));

      const [value, debouncedValue] = result.current;
      expect(value).toBe(42);
      expect(debouncedValue).toBe(42);
    });

    it('should initialize with object value', () => {
      const initialObject = { name: 'test', count: 0 };
      const { result } = renderHook(() => useDebouncedState(initialObject));

      const [value, debouncedValue] = result.current;
      expect(value).toEqual(initialObject);
      expect(debouncedValue).toEqual(initialObject);
    });
  });

  describe('value updates', () => {
    it('should update value immediately', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      const [value] = result.current;
      expect(value).toBe('updated');
    });

    it('should not update debounced value immediately', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      const [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('initial'); // Still the initial value
    });

    it('should update debounced value after default delay (300ms)', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      // Advance timers by 300ms (default debounce time)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('updated');
    });

    it('should not update debounced value before delay', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      // Advance timers by 299ms (just before debounce time)
      act(() => {
        vi.advanceTimersByTime(299);
      });

      const [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('initial');
    });
  });

  describe('custom debounce time', () => {
    it('should use custom debounce time', () => {
      const { result } = renderHook(() => useDebouncedState('initial', 500));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      // After 300ms, still not updated
      act(() => {
        vi.advanceTimersByTime(300);
      });

      let [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('initial');

      // After 500ms, should be updated
      act(() => {
        vi.advanceTimersByTime(200);
      });

      [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('updated');
    });

    it('should handle very short debounce time', () => {
      const { result } = renderHook(() => useDebouncedState('initial', 50));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('updated');
    });

    it('should handle zero debounce time', () => {
      const { result } = renderHook(() => useDebouncedState('initial', 0));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('updated');
    });
  });

  describe('rapid updates', () => {
    it('should reset timer on each update', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      // First update
      act(() => {
        const [, , setValue] = result.current;
        setValue('first');
      });

      // Advance 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Second update before debounce completes
      act(() => {
        const [, , setValue] = result.current;
        setValue('second');
      });

      // Advance another 200ms (400ms total, but only 200ms since last update)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Debounced value should still not be updated
      let [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('initial');

      // Advance 100ms more (300ms since last update)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Now it should be updated to 'second'
      [, debouncedValue] = result.current;
      expect(debouncedValue).toBe('second');
    });

    it('should only use the latest value after rapid updates', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      // Rapid updates
      act(() => {
        const [, , setValue] = result.current;
        setValue('first');
      });
      act(() => {
        const [, , setValue] = result.current;
        setValue('second');
      });
      act(() => {
        const [, , setValue] = result.current;
        setValue('third');
      });
      act(() => {
        const [, , setValue] = result.current;
        setValue('final');
      });

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const [value, debouncedValue] = result.current;
      expect(value).toBe('final');
      expect(debouncedValue).toBe('final');
    });
  });

  describe('setValue function', () => {
    it('should accept direct value', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      act(() => {
        const [, , setValue] = result.current;
        setValue('new value');
      });

      expect(result.current[0]).toBe('new value');
    });

    it('should accept function updater', () => {
      const { result } = renderHook(() => useDebouncedState(0));

      act(() => {
        const [, , setValue] = result.current;
        setValue((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);

      act(() => {
        const [, , setValue] = result.current;
        setValue((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(6);
    });

    it('should maintain function identity across renders', () => {
      const { result, rerender } = renderHook(() => useDebouncedState('test'));

      const setValueFirst = result.current[2];
      rerender();
      const setValueSecond = result.current[2];

      // setValue should be the same function reference
      expect(setValueFirst).toBe(setValueSecond);
    });
  });

  describe('cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useDebouncedState('initial')
      );

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      // Unmount before timeout
      unmount();

      // This should not throw
      act(() => {
        vi.advanceTimersByTime(300);
      });
    });
  });

  describe('return value structure', () => {
    it('should return array with three elements', () => {
      const { result } = renderHook(() => useDebouncedState('test'));

      expect(result.current).toHaveLength(3);
      expect(typeof result.current[0]).toBe('string'); // value
      expect(typeof result.current[1]).toBe('string'); // debouncedValue
      expect(typeof result.current[2]).toBe('function'); // setValue
    });
  });
});
