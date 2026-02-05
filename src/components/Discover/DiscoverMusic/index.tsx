import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import useDiscover from '@app/hooks/useDiscover';
import Error from '@app/pages/_error';
import { BarsArrowDownIcon } from '@heroicons/react/24/solid';
import type { AlbumResult, ArtistResult } from '@server/models/Search';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  discovermusic: 'Music',
  artists: 'Artists',
  albums: 'Albums',
  sortNameAsc: 'Name (A-Z)',
  sortNameDesc: 'Name (Z-A)',
  sortTagCount: 'Most Popular',
  sortDateDesc: 'Release Date (Newest)',
  sortDateAsc: 'Release Date (Oldest)',
});

const ArtistSortOptions = {
  NameAsc: 'name',
  NameDesc: 'name-desc',
  TagCount: 'tagcount',
} as const;

const AlbumSortOptions = {
  DateDesc: 'date',
  DateAsc: 'date-asc',
  TitleAsc: 'title',
  TitleDesc: 'title-desc',
  TagCount: 'tagcount',
} as const;

type TabType = 'artists' | 'albums';

const DiscoverMusic = () => {
  const intl = useIntl();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('artists');

  // Get sort from URL query or default based on active tab
  const getDefaultSort = (tab: TabType) =>
    tab === 'artists' ? 'tagcount' : 'date';
  const currentSort =
    (router.query.sortBy as string) || getDefaultSort(activeTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Reset sort when switching tabs to a valid default
    const newSort = getDefaultSort(tab);
    const { pathname, query } = router;
    const newQuery = { ...query, sortBy: newSort };
    router.replace({ pathname, query: newQuery }, undefined, { shallow: true });
  };

  const handleSortChange = (value: string) => {
    const { pathname, query } = router;
    const newQuery = { ...query, sortBy: value };
    router.replace({ pathname, query: newQuery }, undefined, { shallow: true });
  };

  // Validate sort value is valid for current tab
  const getValidSort = (tab: TabType, sort: string): string => {
    const validSorts =
      tab === 'artists'
        ? ['tagcount', 'name', 'name-desc']
        : ['date', 'date-asc', 'title', 'title-desc', 'tagcount'];
    return validSorts.includes(sort) ? sort : getDefaultSort(tab);
  };

  const validSort = getValidSort(activeTab, currentSort);

  // Artists data
  const {
    isLoadingInitialData: isLoadingArtists,
    isEmpty: isEmptyArtists,
    isLoadingMore: isLoadingMoreArtists,
    isReachingEnd: isReachingEndArtists,
    titles: artists,
    fetchMore: fetchMoreArtists,
    error: errorArtists,
  } = useDiscover<ArtistResult>(
    '/api/v1/discover/artists',
    {
      sortBy: validSort,
    },
    { hideAvailable: false, enabled: activeTab === 'artists' }
  );

  // Albums data
  const {
    isLoadingInitialData: isLoadingAlbums,
    isEmpty: isEmptyAlbums,
    isLoadingMore: isLoadingMoreAlbums,
    isReachingEnd: isReachingEndAlbums,
    titles: albums,
    fetchMore: fetchMoreAlbums,
    error: errorAlbums,
  } = useDiscover<AlbumResult>(
    '/api/v1/discover/albums',
    {
      sortBy: validSort,
    },
    { hideAvailable: false, enabled: activeTab === 'albums' }
  );

  const error = activeTab === 'artists' ? errorArtists : errorAlbums;

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discovermusic);

  const getSortOptions = () => {
    if (activeTab === 'artists') {
      return [
        { value: ArtistSortOptions.TagCount, label: messages.sortTagCount },
        { value: ArtistSortOptions.NameAsc, label: messages.sortNameAsc },
        { value: ArtistSortOptions.NameDesc, label: messages.sortNameDesc },
      ];
    }
    return [
      { value: AlbumSortOptions.DateDesc, label: messages.sortDateDesc },
      { value: AlbumSortOptions.DateAsc, label: messages.sortDateAsc },
      { value: AlbumSortOptions.TitleAsc, label: messages.sortNameAsc },
      { value: AlbumSortOptions.TitleDesc, label: messages.sortNameDesc },
      { value: AlbumSortOptions.TagCount, label: messages.sortTagCount },
    ];
  };

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <div className="flex items-center gap-4">
          <Header>{title}</Header>
          {/* Tab Navigation */}
          <div className="flex rounded-md bg-gray-800 p-1">
            <button
              onClick={() => handleTabChange('artists')}
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'artists'
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {intl.formatMessage(messages.artists)}
            </button>
            <button
              onClick={() => handleTabChange('albums')}
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'albums'
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {intl.formatMessage(messages.albums)}
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
              <BarsArrowDownIcon className="h-6 w-6" />
            </span>
            <select
              id="sortBy"
              name="sortBy"
              className="rounded-r-only"
              value={validSort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {getSortOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {intl.formatMessage(option.label)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'artists' && (
        <ListView
          items={artists}
          isEmpty={isEmptyArtists}
          isLoading={
            isLoadingArtists ||
            (isLoadingMoreArtists && (artists?.length ?? 0) > 0)
          }
          isReachingEnd={isReachingEndArtists}
          onScrollBottom={fetchMoreArtists}
        />
      )}

      {activeTab === 'albums' && (
        <ListView
          items={albums}
          isEmpty={isEmptyAlbums}
          isLoading={
            isLoadingAlbums ||
            (isLoadingMoreAlbums && (albums?.length ?? 0) > 0)
          }
          isReachingEnd={isReachingEndAlbums}
          onScrollBottom={fetchMoreAlbums}
        />
      )}
    </>
  );
};

export default DiscoverMusic;
