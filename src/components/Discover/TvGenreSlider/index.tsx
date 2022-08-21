import { genreColorMap } from '@/components/Discover/constants';
import GenreCard from '@/components/GenreCard';
import Slider from '@/components/Slider';
import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import type { GenreSliderItem } from '@server/interfaces/api/discoverInterfaces';
import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  tvgenres: 'Series Genres',
});

const TvGenreSlider = () => {
  const intl = useIntl();
  const { data, error } = useSWR<GenreSliderItem[]>(
    `/api/v1/discover/genreslider/tv`,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return (
    <>
      <div className="slider-header">
        <Link href="/discover/tv/genres">
          <a className="slider-title">
            <span>{intl.formatMessage(messages.tvgenres)}</span>
            <ArrowCircleRightIcon />
          </a>
        </Link>
      </div>
      <Slider
        sliderKey="tv-genres"
        isLoading={!data && !error}
        isEmpty={false}
        items={(data ?? []).map((genre, index) => (
          <GenreCard
            key={`genre-tv-${genre.id}-${index}`}
            name={genre.name}
            image={`https://image.tmdb.org/t/p/w1280_filter(duotone,${
              genreColorMap[genre.id] ?? genreColorMap[0]
            })${genre.backdrops[4]}`}
            url={`/discover/tv/genre/${genre.id}`}
          />
        ))}
        placeholder={<GenreCard.Placeholder />}
        emptyMessage=""
      />
    </>
  );
};

export default React.memo(TvGenreSlider);
