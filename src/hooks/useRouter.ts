import { NextRouter, useRouter as useNextRouter } from 'next/router';
import { useMemo } from 'react';
import addBasePath from '../utils/addBasePath';

const basePath = addBasePath('');

const urlPropertyFields = [
  'pathname',
  'events',
  'route',
  'query',
  'asPath',
  'components',
  'isFallback',
  'basePath',
  'locale',
  'locales',
  'defaultLocale',
  'isReady',
  'isPreview',
  'isLocaleDomain',
  'domainLocales',
];

const coreMethodFields = ['reload', 'back', 'prefetch', 'beforePopState'];

const wrapRouter = (target: any): NextRouter => {
  const router = {
    push(url: URL, as?: URL, options?: never) {
      return target.push(
        addBasePath(url),
        as ? addBasePath(as) : undefined,
        options
      );
    },
    replace(url: URL, as?: URL, options?: never) {
      return target.push(
        addBasePath(url),
        as ? addBasePath(as) : undefined,
        options
      );
    },
    get basePath() {
      return basePath;
    },
  };

  urlPropertyFields.forEach((field: string) => {
    Object.defineProperty(router, field, {
      get() {
        return target[field] as string;
      },
    });
  });

  coreMethodFields.forEach((field: string) => {
    (router as any)[field] = (...args: any[]) => {
      return target[field](...args);
    };
  });
  return router as NextRouter;
};

export const useRouter = (): NextRouter => {
  const router = useNextRouter();
  return useMemo(() => wrapRouter(router), [router]);
};
