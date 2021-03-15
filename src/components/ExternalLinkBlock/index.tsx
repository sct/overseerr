import React from 'react';
import TmdbLogo from '../../assets/services/tmdb.svg';
import TvdbLogo from '../../assets/services/tvdb.svg';
import ImdbLogo from '../../assets/services/imdb.svg';
import RTLogo from '../../assets/services/rt.svg';
import PlexLogo from '../../assets/services/plex.svg';
import { MediaType } from '../../../server/constants/media';

interface ExternalLinkBlockProps {
  mediaType: 'movie' | 'tv';
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
  rtUrl?: string;
  plexUrl?: string;
}

const ExternalLinkBlock: React.FC<ExternalLinkBlockProps> = ({
  mediaType,
  tmdbId,
  tvdbId,
  imdbId,
  rtUrl,
  plexUrl,
}) => {
  return (
    <div className="flex items-center justify-center w-full space-x-5">
      {plexUrl && (
        <a
          href={plexUrl}
          className="w-12 transition duration-300 opacity-50 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <PlexLogo />
        </a>
      )}
      {tmdbId && (
        <a
          href={`https://www.themoviedb.org/${mediaType}/${tmdbId}`}
          className="w-8 transition duration-300 opacity-50 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <TmdbLogo />
        </a>
      )}
      {tvdbId && mediaType === MediaType.TV && (
        <a
          href={`http://www.thetvdb.com/?tab=series&id=${tvdbId}`}
          className="transition duration-300 opacity-50 w-9 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <TvdbLogo />
        </a>
      )}
      {imdbId && (
        <a
          href={`https://www.imdb.com/title/${imdbId}`}
          className="w-8 transition duration-300 opacity-50 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <ImdbLogo />
        </a>
      )}
      {rtUrl && (
        <a
          href={`${rtUrl}`}
          className="transition duration-300 opacity-50 w-14 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <RTLogo />
        </a>
      )}
    </div>
  );
};

export default ExternalLinkBlock;
