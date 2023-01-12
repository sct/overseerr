import { genreColorMap } from '@app/components/Discover/constants';
import GenreCard from '@app/components/GenreCard';
import Slider from '@app/components/Slider';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import type { GenreSliderItem } from '@server/interfaces/api/discoverInterfaces';
import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  moviegenres: 'Movie Genres',
});

const MovieGenreSlider = () => {
  const intl = useIntl();
  const { data, error } = useSWR<GenreSliderItem[]>(
    `/api/v1/discover/genreslider/movie`,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return (
    <>
      <div className="slider-header">
        <Link href="/discover/movies/genres">
          <a className="slider-title">
            <span>{intl.formatMessage(messages.moviegenres)}</span>
            <ArrowRightCircleIcon />
          </a>
        </Link>
      </div>
      <Slider
        sliderKey="movie-genres"
        isLoading={!data && !error}
        isEmpty={false}
        items={(data ?? []).map((genre, index) => (
          <GenreCard
            key={`genre-${genre.id}-${index}`}
            name={genre.name}
            image={`https://image.tmdb.org/t/p/w1280_filter(duotone,${
              genreColorMap[genre.id] ?? genreColorMap[0]
            })${genre.backdrops[4]}`}
            url={`/discover/movies?genre=${genre.id}`}
          />
        ))}
        placeholder={<GenreCard.Placeholder />}
        emptyMessage=""
      />
    </>
  );
};

export default React.memo(MovieGenreSlider);
