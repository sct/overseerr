import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';
import TitleCard from '.';
import type { MovieDetails } from '../../../server/models/Movie';
import type { TvDetails } from '../../../server/models/Tv';
import { Permission, useUser } from '../../hooks/useUser';

export interface TmdbTitleCardProps {
  id: number;
  tmdbId: number;
  tvdbId?: number;
  type: 'movie' | 'tv';
}

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const TmdbTitleCard = ({ id, tmdbId, tvdbId, type }: TmdbTitleCardProps) => {
  const { hasPermission } = useUser();

  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const url =
    type === 'movie' ? `/api/v1/movie/${tmdbId}` : `/api/v1/tv/${tmdbId}`;
  const { data: title, error } = useSWR<MovieDetails | TvDetails>(
    inView ? `${url}` : null
  );

  if (!title && !error) {
    return (
      <div ref={ref}>
        <TitleCard.Placeholder />
      </div>
    );
  }

  if (!title) {
    return hasPermission(Permission.ADMIN) ? (
      <TitleCard.ErrorCard
        id={id}
        tmdbId={tmdbId}
        tvdbId={tvdbId}
        type={type}
      />
    ) : null;
  }

  return isMovie(title) ? (
    <TitleCard
      id={title.id}
      image={title.posterPath}
      status={title.mediaInfo?.status}
      summary={title.overview}
      title={title.title}
      userScore={title.voteAverage}
      year={title.releaseDate}
      mediaType={'movie'}
    />
  ) : (
    <TitleCard
      id={title.id}
      image={title.posterPath}
      status={title.mediaInfo?.status}
      summary={title.overview}
      title={title.name}
      userScore={title.voteAverage}
      year={title.firstAirDate}
      mediaType={'tv'}
    />
  );
};

export default TmdbTitleCard;
