import { MediaStatus } from '@server/constants/media';
import useSWRInfinite from 'swr/infinite';
import useSettings from './useSettings';

export interface BaseSearchResult<T> {
  page: number;
  totalResults: number;
  totalPages: number;
  results: T[];
}

interface BaseMedia {
  mediaType: string;
  mediaInfo?: {
    status: MediaStatus;
  };
}

interface DiscoverResult<T, S> {
  isLoadingInitialData: boolean;
  isLoadingMore: boolean;
  fetchMore: () => void;
  isEmpty: boolean;
  isReachingEnd: boolean;
  error: unknown;
  titles: T[];
  firstResultData?: BaseSearchResult<T> & S;
}

const extraEncodes: [RegExp, string][] = [
  [/\(/g, '%28'],
  [/\)/g, '%29'],
  [/!/g, '%21'],
  [/\*/g, '%2A'],
];

export const encodeURIExtraParams = (string: string): string => {
  let finalString = encodeURIComponent(string);

  extraEncodes.forEach((encode) => {
    finalString = finalString.replace(encode[0], encode[1]);
  });

  return finalString;
};

const useDiscover = <
  T extends BaseMedia,
  S = Record<string, never>,
  O = Record<string, unknown>
>(
  endpoint: string,
  options?: O,
  { hideAvailable = true } = {}
): DiscoverResult<T, S> => {
  const settings = useSettings();
  const { data, error, size, setSize, isValidating } = useSWRInfinite<
    BaseSearchResult<T> & S
  >(
    (pageIndex: number, previousPageData) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      const params: Record<string, unknown> = {
        page: pageIndex + 1,
        ...options,
      };

      const finalQueryString = Object.keys(params)
        .map(
          (paramKey) =>
            `${paramKey}=${encodeURIExtraParams(params[paramKey] as string)}`
        )
        .join('&');

      return `${endpoint}?${finalQueryString}`;
    },
    {
      initialSize: 3,
    }
  );

  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 &&
      !!data &&
      typeof data[size - 1] === 'undefined' &&
      isValidating);

  const fetchMore = () => {
    setSize(size + 1);
  };

  let titles = (data ?? []).reduce((a, v) => [...a, ...v.results], [] as T[]);

  if (settings.currentSettings.hideAvailable && hideAvailable) {
    titles = titles.filter(
      (i) =>
        (i.mediaType === 'movie' || i.mediaType === 'tv') &&
        i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
        i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
    );
  }

  const isEmpty = !isLoadingInitialData && titles?.length === 0;
  const isReachingEnd =
    isEmpty ||
    (!!data && (data[data?.length - 1]?.results.length ?? 0) < 20) ||
    (!!data && (data[data?.length - 1]?.totalResults ?? 0) < 41);

  return {
    isLoadingInitialData,
    isLoadingMore,
    fetchMore,
    isEmpty,
    isReachingEnd,
    error,
    titles,
    firstResultData: data?.[0],
  };
};

export default useDiscover;
