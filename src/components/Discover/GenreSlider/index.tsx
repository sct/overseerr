import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import GenreCard from '../../GenreCard';
import Slider from '../../Slider';

const messages = defineMessages({
  moviegenres: 'Movie Genres',
});

interface SliderGenre {
  name: string;
  image: string;
  url: string;
}

const genres: SliderGenre[] = [
  {
    name: 'Action',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,991B1B,FCA5A5)/mGJuQwMq1bEboaVTqQAK4p4zQvC.jpg',
    url: '/discover/movies/genre/28',
  },
  {
    name: 'Adventure',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,032541,01b4e4)/hJuDvwzS0SPlsE6MNFOpznQltDZ.jpg',
    url: '/discover/movies/genre/12',
  },
  {
    name: 'Animation',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,92400E,FCD34D)/f1pxwKEQsOToBBoIzOTB5RQqspw.jpg',
    url: '/discover/movies/genre/16',
  },
  {
    name: 'Comedy',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,065F46,6EE7B7)/8uBTDGRcNHhYChcoazP5rleRME7.jpg',
    url: '/discover/movies/genre/35',
  },
  {
    name: 'Crime',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,1F2937,2864d2)/lWNASscWXn32Asr9vkB1wq6cKvD.jpg',
    url: '/discover/movies/genre/80',
  },
  {
    name: 'Documentary',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,087d29,21cb51)/biqadKPvPk3xi8ghu1l7qmnS2cI.jpg',
    url: '/discover/movies/genre/99',
  },
  {
    name: 'Drama',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,5B21B6,C4B5FD)/mnDvPokXpvsdPcWSjNRPhiiLOKu.jpg',
    url: '/discover/movies/genre/18',
  },
  {
    name: 'Family',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,777e0d,e4ed55)/askg3SMvhqEl4OL52YuvdtY40Yb.jpg',
    url: '/discover/movies/genre/10751',
  },
  {
    name: 'Fantasy',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,552c01,d47c1d)/lXhgCODAbBXL5buk9yEmTpOoOgR.jpg',
    url: '/discover/movies/genre/14',
  },
  {
    name: 'Horror',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,1F2937,D1D5DB)/n7TDRuPGptgtiJtV1zqDsJxYo8L.jpg',
    url: '/discover/movies/genre/27',
  },
  {
    name: 'Romance',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,9D174D,F9A8D4)/b5bcKhvN6VP82U5ztNdPfOLiolD.jpg',
    url: '/discover/movies/genre/10749',
  },
  {
    name: 'Science Fiction',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,1F2937,60A5FA)/jn52me8AagfNt7r84SgQbV0R9ZG.jpg',
    url: '/discover/movies/genre/878',
  },
  {
    name: 'Thriller',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,480c8b,a96bef)/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    url: '/discover/movies/genre/53',
  },
  {
    name: 'War',
    image:
      'https://www.themoviedb.org/t/p/w1280_filter(duotone,1F2937,F87171)/2lBOQK06tltt8SQaswgb8d657Mv.jpg',
    url: '/discover/movies/genre/10752',
  },
];

const GenreSlider: React.FC = () => {
  const intl = useIntl();

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.moviegenres)}</span>
        </div>
      </div>
      <Slider
        sliderKey="genres"
        isLoading={false}
        isEmpty={false}
        items={genres.map((genre, index) => (
          <GenreCard
            key={`genre-${index}`}
            name={genre.name}
            image={genre.image}
            url={genre.url}
          />
        ))}
        emptyMessage=""
      />
    </>
  );
};

export default GenreSlider;
