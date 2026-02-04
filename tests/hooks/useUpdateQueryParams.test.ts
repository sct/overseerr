import {
  filterQueryString,
  mergeQueryString,
} from '@app/hooks/useUpdateQueryParams';
import type { NextRouter } from 'next/router';
import { describe, expect, it, vi } from 'vitest';

// Create a mock router factory
const createMockRouter = (overrides: Partial<NextRouter> = {}): NextRouter =>
  ({
    pathname: '/discover',
    asPath: '/discover',
    query: {},
    push: vi.fn(),
    replace: vi.fn(),
    ...overrides,
  } as unknown as NextRouter);

describe('filterQueryString', () => {
  it('should return all filters when none exist in pathname', () => {
    const router = createMockRouter({
      pathname: '/discover/movies',
    });
    const filters = { genre: '28', year: '2023', page: '1' };

    const result = filterQueryString(router, filters);

    expect(result).toEqual(filters);
  });

  it('should exclude filters that exist in pathname', () => {
    const router = createMockRouter({
      pathname: '/discover/movies/genre/28',
    });
    const filters = { genre: '28', year: '2023' };

    const result = filterQueryString(router, filters);

    expect(result).toEqual({ year: '2023' });
    expect(result.genre).toBeUndefined();
  });

  it('should return empty object when all filters exist in pathname', () => {
    const router = createMockRouter({
      pathname: '/genre/28/year/2023',
    });
    const filters = { genre: '28', year: '2023' };

    const result = filterQueryString(router, filters);

    expect(result).toEqual({});
  });

  it('should handle empty filters object', () => {
    const router = createMockRouter({
      pathname: '/discover',
    });
    const filters = {};

    const result = filterQueryString(router, filters);

    expect(result).toEqual({});
  });

  it('should handle complex pathnames', () => {
    const router = createMockRouter({
      pathname: '/movie/[movieId]',
    });
    const filters = { movieId: '123', related: 'true' };

    const result = filterQueryString(router, filters);

    expect(result).toEqual({ related: 'true' });
  });

  it('should handle array values in filters', () => {
    const router = createMockRouter({
      pathname: '/search',
    });
    const filters = { tags: ['action', 'comedy'], query: 'test' };

    const result = filterQueryString(router, filters);

    expect(result).toEqual(filters);
  });
});

describe('mergeQueryString', () => {
  describe('basic merging', () => {
    it('should merge new query params with existing ones', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover?existing=value',
        query: { existing: 'value' },
      });
      const newQuery = { newParam: 'newValue' };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toContain('existing=value');
      expect(result.pathname).toContain('newParam=newValue');
    });

    it('should create new query string when none exists', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover',
        query: {},
      });
      const newQuery = { genre: '28' };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toBe('/discover?genre=28');
      expect(result.path).toBe('/discover?genre=28');
    });

    it('should override existing query params', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover?page=1',
        query: { page: '1' },
      });
      const newQuery = { page: '5' };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toContain('page=5');
      expect(result.pathname).not.toContain('page=1');
    });
  });

  describe('query param removal', () => {
    it('should remove params with null values', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover?genre=28&year=2023',
        query: { genre: '28', year: '2023' },
      });
      const newQuery = { genre: null };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).not.toContain('genre');
      expect(result.pathname).toContain('year=2023');
    });

    it('should remove params with undefined values', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover?filter=active',
        query: { filter: 'active' },
      });
      const newQuery = { filter: undefined };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).not.toContain('filter');
    });

    it('should remove params with empty string values', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover?search=test',
        query: { search: 'test' },
      });
      const newQuery = { search: '' };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).not.toContain('search');
    });
  });

  describe('path handling', () => {
    it('should extract base path from asPath with query string', () => {
      const router = createMockRouter({
        pathname: '/movies',
        asPath: '/movies?genre=action&year=2023',
        query: { genre: 'action', year: '2023' },
      });
      const newQuery = { page: '2' };

      const result = mergeQueryString(router, newQuery);

      expect(result.path).toMatch(/^\/movies\?/);
    });

    it('should handle asPath without query string', () => {
      const router = createMockRouter({
        pathname: '/movies',
        asPath: '/movies',
        query: {},
      });
      const newQuery = { genre: '28' };

      const result = mergeQueryString(router, newQuery);

      expect(result.path).toBe('/movies?genre=28');
    });

    it('should preserve pathname and path consistency', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover',
        query: {},
      });
      const newQuery = { test: 'value' };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toBe('/discover?test=value');
      expect(result.path).toBe('/discover?test=value');
    });
  });

  describe('filter integration', () => {
    it('should filter out dynamic route params from query', () => {
      const router = createMockRouter({
        pathname: '/movie/[movieId]',
        asPath: '/movie/123?related=true',
        query: { movieId: '123', related: 'true' },
      });
      const newQuery = { page: '2' };

      const result = mergeQueryString(router, newQuery);

      // movieId is filtered because it's part of the pathname template [movieId]
      // The pathname will contain [movieId] as the template, but movieId won't be in query params
      expect(result.pathname).toContain('related=true');
      expect(result.pathname).toContain('page=2');
      // Verify movieId is not added as a query parameter (e.g., movieId=123)
      expect(result.pathname).not.toContain('movieId=123');
    });
  });

  describe('edge cases', () => {
    it('should handle empty new query', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover?existing=value',
        query: { existing: 'value' },
      });
      const newQuery = {};

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toContain('existing=value');
    });

    it('should handle special characters in values', () => {
      const router = createMockRouter({
        pathname: '/search',
        asPath: '/search',
        query: {},
      });
      const newQuery = { q: 'test query' };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toContain('q=test query');
    });

    it('should return paths without query string when all params removed', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover?only=param',
        query: { only: 'param' },
      });
      const newQuery = { only: null };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toBe('/discover');
      expect(result.path).toBe('/discover');
    });

    it('should handle multiple query params', () => {
      const router = createMockRouter({
        pathname: '/discover',
        asPath: '/discover',
        query: {},
      });
      const newQuery = { a: '1', b: '2', c: '3', d: '4' };

      const result = mergeQueryString(router, newQuery);

      expect(result.pathname).toContain('a=1');
      expect(result.pathname).toContain('b=2');
      expect(result.pathname).toContain('c=3');
      expect(result.pathname).toContain('d=4');
    });
  });
});
