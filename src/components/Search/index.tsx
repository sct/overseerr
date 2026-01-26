import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import useDiscover from '@app/hooks/useDiscover';
import globalMessages from '@app/i18n/globalMessages';
import { MediaStatus } from '@server/constants/media';
import Error from '@app/pages/_error';
import type {
  MovieResult,
  PersonResult,
  TvResult,
  ArtistResult,
  AlbumResult,
} from '@server/models/Search';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  search: 'Search',
  searchresults: 'Search Results',
  filters: 'Filters',
  clearFilters: 'Clear Filters',
  year: 'Year',
  genre: 'Genre',
  mediaType: 'Type',
  status: 'Availability',
  allTypes: 'All Types',
  movie: 'Movie',
  tv: 'TV Show',
  allGenres: 'All Genres',
  allYears: 'All Years',
  allStatuses: 'All Statuses',
});

const Search = () => {
  const intl = useIntl();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [year, setYear] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [mediaType, setMediaType] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const { data: movieGenres } = useSWR('/api/v1/genres/movie');
  const { data: tvGenres } = useSWR('/api/v1/genres/tv');

  useEffect(() => {
    if (router.query.year) setYear(String(router.query.year));
    if (router.query.genre) setGenre(String(router.query.genre));
    if (router.query.mediaType) setMediaType(String(router.query.mediaType));
    if (router.query.status) setStatus(String(router.query.status));
  }, [router.query]);

  const applyFilters = () => {
    const query: Record<string, string> = {};
    // Preserve existing query params
    if (router.query.query) query.query = String(router.query.query);
    if (year) query.year = year;
    if (genre) query.genre = genre;
    if (mediaType) query.mediaType = mediaType;
    if (status) query.status = status;
    router.push({ pathname: router.pathname, query });
  };

  const clearFilters = () => {
    setYear('');
    setGenre('');
    setMediaType('');
    setStatus('');
    const query = { ...router.query };
    delete query.year;
    delete query.genre;
    delete query.mediaType;
    delete query.status;
    router.push({ pathname: router.pathname, query });
  };

  const hasActiveFilters = !!(year || genre || mediaType || status);

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<MovieResult | TvResult | PersonResult | ArtistResult | AlbumResult>(
    `/api/v1/search`,
    {
      query: router.query.query,
      ...(year && { year: Number(year) }),
      ...(genre && { genre: Number(genre) }),
      ...(mediaType && { mediaType }),
      ...(status && { status }),
    },
    { hideAvailable: false }
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const allGenres = [
    ...(movieGenres?.genres || []),
    ...(tvGenres?.genres || []),
  ].filter(
    (g, i, arr) => arr.findIndex((g2) => g2.id === g.id) === i
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.search)} />
      <div className="mt-1 mb-5">
        <div className="flex items-center justify-between">
          <Header>{intl.formatMessage(messages.searchresults)}</Header>
          <Button
            buttonType={hasActiveFilters ? 'primary' : 'default'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>{intl.formatMessage(messages.filters)}</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-lg bg-gray-800 p-4 ring-1 ring-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {intl.formatMessage(messages.filters)}
            </h3>
            {hasActiveFilters && (
              <Button buttonType="ghost" onClick={clearFilters}>
                <XMarkIcon className="h-4 w-4" />
                <span>{intl.formatMessage(messages.clearFilters)}</span>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-label">
                {intl.formatMessage(messages.mediaType)}
              </label>
              <select
                className="form-input-field"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
              >
                <option value="">{intl.formatMessage(messages.allTypes)}</option>
                <option value="movie">{intl.formatMessage(messages.movie)}</option>
                <option value="tv">{intl.formatMessage(messages.tv)}</option>
              </select>
            </div>
            <div>
              <label className="text-label">
                {intl.formatMessage(messages.year)}
              </label>
              <select
                className="form-input-field"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">{intl.formatMessage(messages.allYears)}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label">
                {intl.formatMessage(messages.genre)}
              </label>
              <select
                className="form-input-field"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="">{intl.formatMessage(messages.allGenres)}</option>
                {allGenres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label">
                {intl.formatMessage(messages.status)}
              </label>
              <select
                className="form-input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">{intl.formatMessage(messages.allStatuses)}</option>
                <option value={String(MediaStatus.UNKNOWN)}>Unknown</option>
                <option value={String(MediaStatus.PENDING)}>Pending</option>
                <option value={String(MediaStatus.PROCESSING)}>Processing</option>
                <option value={String(MediaStatus.AVAILABLE)}>Available</option>
                <option value={String(MediaStatus.PARTIALLY_AVAILABLE)}>
                  Partially Available
                </option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button buttonType="primary" onClick={applyFilters}>
              {intl.formatMessage(globalMessages.save)}
            </Button>
          </div>
        </div>
      )}

      <ListView
        items={titles}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default Search;
