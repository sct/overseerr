import Slider from '@app/components/Slider';
import TmdbTitleCard from '@app/components/TitleCard/TmdbTitleCard';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import type { WatchlistItem } from '@server/interfaces/api/discoverInterfaces';
import Link from 'next/link';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  externalwatchlist: 'External Watchlist',
  emptywatchlist: 'Media added to the list will appear here.',
});

interface ExternalWatchlistSliderProps {
  title: string;
  url: string;
  linkUrl?: string;
  sliderKey: string;
}

const ExternalWatchlistSlider = ({
  title,
  url,
  linkUrl,
  sliderKey,
}: ExternalWatchlistSliderProps) => {
  const intl = useIntl();

  const { data: watchlistItems, error: watchlistError } = useSWR<{
    page: number;
    totalPages: number;
    totalResults: number;
    results: WatchlistItem[];
  }>(url, { revalidateOnMount: true });

  if (
    (watchlistItems && watchlistItems.results.length === 0) ||
    watchlistError
  ) {
    return null;
  }

  return (
    <>
      <div className="slider-header">
        {linkUrl ? (
          <Link href={linkUrl}>
            <a className="slider-title min-w-0 pr-16">
              <span className="truncate">{title}</span>
              <ArrowRightCircleIcon />
            </a>
          </Link>
        ) : (
          <div className="slider-title">
            <span>{title}</span>
          </div>
        )}
      </div>
      <Slider
        sliderKey={sliderKey}
        isLoading={!watchlistItems}
        isEmpty={!!watchlistItems && watchlistItems.results.length === 0}
        emptyMessage={intl.formatMessage(messages.emptywatchlist)}
        items={watchlistItems?.results.map((item) => (
          <TmdbTitleCard
            id={item.tmdbId}
            key={`watchlist-slider-item-${item.key}`}
            tmdbId={item.tmdbId}
            type={item.mediaType}
          />
        ))}
      />
    </>
  );
};

export default ExternalWatchlistSlider;
