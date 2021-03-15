import React, { useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import GenreCard from '../../GenreCard';
import Slider from '../../Slider';
import { GenreSliderItem } from '../../../../server/interfaces/api/discoverInterfaces';
import { LanguageContext } from '../../../context/LanguageContext';
import { genreColorMap } from '../constants';

const messages = defineMessages({
  moviegenres: 'Movie Genres',
});

const MovieGenreSlider: React.FC = () => {
  const { locale } = useContext(LanguageContext);
  const intl = useIntl();
  const { data, error } = useSWR<GenreSliderItem[]>(
    `/api/v1/discover/genreslider/movie?language=${locale}`,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.moviegenres)}</span>
        </div>
      </div>
      <Slider
        sliderKey="movie-genres"
        isLoading={!data && !error}
        isEmpty={false}
        items={(data ?? []).map((genre, index) => (
          <GenreCard
            key={`genre-${genre.id}-${index}`}
            name={genre.name}
            image={`https://www.themoviedb.org/t/p/w1280_filter(duotone,${
              genreColorMap[genre.id] ?? genreColorMap[0]
            })${genre.backdrops[4]}`}
            url={`/discover/movies/genre/${genre.id}`}
          />
        ))}
        placeholder={<GenreCard.Placeholder />}
        emptyMessage=""
      />
    </>
  );
};

export default React.memo(MovieGenreSlider);
