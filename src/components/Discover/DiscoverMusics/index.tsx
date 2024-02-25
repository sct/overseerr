import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import type { FilterOptions } from '@app/components/Discover/constants';
import {
  countActiveFilters,
  prepareFilterValues,
} from '@app/components/Discover/constants';
import FilterSlideover from '@app/components/Discover/FilterSlideover';
import RecentlyAddedSlider from '@app/components/Discover/RecentlyAddedSlider';
import useDiscover from '@app/hooks/useDiscover';
import Error from '@app/pages/_error';
import { FunnelIcon } from '@heroicons/react/24/solid';
import type { ArtistResult, ReleaseResult } from '@server/models/Search';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  discovermusics: 'Musics',
  activefilters:
    '{count, plural, one {# Active Filter} other {# Active Filters}}',
  discovermoremusics: 'Discover More Musics',
});

const DiscoverMusics = () => {
  const intl = useIntl();
  const router = useRouter();

  const preparedFilters = prepareFilterValues(router.query);

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<ReleaseResult | ArtistResult, unknown, FilterOptions>(
    '/api/v1/discover/musics',
    preparedFilters
  );
  const [showFilters, setShowFilters] = useState(false);

  if (error || !titles) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discovermusics);

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header>{title}</Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <FilterSlideover
            type="music"
            currentFilters={preparedFilters}
            onClose={() => setShowFilters(false)}
            show={showFilters}
          />
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
            <Button onClick={() => setShowFilters(true)} className="w-full">
              <FunnelIcon />
              <span>
                {intl.formatMessage(messages.activefilters, {
                  count: countActiveFilters(preparedFilters),
                })}
              </span>
            </Button>
          </div>
        </div>
      </div>
      {Object.keys(preparedFilters).length === 0 && (
        <RecentlyAddedSlider type="artist" />
      )}
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.discovermoremusics)}</span>
        </div>
      </div>
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

export default DiscoverMusics;
