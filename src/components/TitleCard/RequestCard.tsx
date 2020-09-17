import React, { useContext } from 'react';
import useSWR from 'swr';
import type { MovieDetails } from '../../../server/models/Movie';
import type { TvDetails } from '../../../server/models/Tv';
import TitleCard from '.';
import { LanguageContext } from '../../context/LanguageContext';

interface TmdbTitleCardProps {
  tmdbId: number;
  type: 'movie' | 'tv';
}

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const RequestCard: React.FC<TmdbTitleCardProps> = ({ tmdbId, type }) => {
  const { locale } = useContext(LanguageContext);
  const url =
    type === 'movie' ? `/api/v1/movie/${tmdbId}` : `/api/v1/tv/${tmdbId}`;
  const { data: title, error } = useSWR<MovieDetails | TvDetails>(
    `${url}?language=${locale}`
  );

  if (!title && !error) {
    return <TitleCard.Placeholder />;
  }

  if (!title) {
    return <TitleCard.Placeholder />;
  }

  return isMovie(title) ? (
    <TitleCard
      id={title.id}
      image={title.posterPath}
      status={title.request?.status}
      summary={title.overview}
      title={title.title}
      userScore={title.voteAverage}
      year={title.releaseDate}
      mediaType={'movie'}
      requestId={title.request?.id}
    />
  ) : (
    <TitleCard
      id={title.id}
      image={title.posterPath}
      status={title.request?.status}
      summary={title.overview}
      title={title.name}
      userScore={title.voteAverage}
      year={title.firstAirDate}
      mediaType={'tv'}
      requestId={title.request?.id}
    />
  );
};

export default RequestCard;
