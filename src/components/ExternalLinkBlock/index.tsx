import React from 'react';
import TmdbLogo from '../../assets/services/tmdb.svg';
import ImdbLogo from '../../assets/services/imdb.svg';
import RTLogo from '../../assets/services/rt.svg';
import PlexLogo from '../../assets/services/plex.svg';

interface ExternalLinkBlockProps {
  mediaType: 'movie' | 'tv';
  imdbId?: string;
  tmdbId?: number;
  rtUrl?: string;
  plexUrl?: string;
}

const ExternalLinkBlock: React.FC<ExternalLinkBlockProps> = ({
  imdbId,
  tmdbId,
  rtUrl,
  mediaType,
  plexUrl,
}) => {
  return (
    <div className="flex justify-end items-center">
      {plexUrl && (
        <a
          href={plexUrl}
          className="w-8 mx-2 opacity-50 hover:opacity-100 transition duration-300"
          target="_blank"
          rel="noreferrer"
        >
          <PlexLogo />
        </a>
      )}
      {tmdbId && (
        <a
          href={`https://www.themoviedb.org/${mediaType}/${tmdbId}`}
          className="w-8 mx-2 opacity-50 hover:opacity-100 transition duration-300"
          target="_blank"
          rel="noreferrer"
        >
          <TmdbLogo />
        </a>
      )}
      {imdbId && (
        <a
          href={`https://www.imdb.com/title/${imdbId}`}
          className="w-8 mx-2 opacity-50 hover:opacity-100 transition duration-300"
          target="_blank"
          rel="noreferrer"
        >
          <ImdbLogo />
        </a>
      )}
      {rtUrl && (
        <a
          href={`${rtUrl}`}
          className="w-14 mx-2 opacity-50 hover:opacity-100 transition duration-300"
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
