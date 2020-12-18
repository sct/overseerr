import React from 'react';
import TmdbLogo from '../../assets/services/tmdb.svg';
import ImdbLogo from '../../assets/services/imdb.svg';
import RTLogo from '../../assets/services/rt.svg';

interface ExternalLinkBlockProps {
  mediaType: 'movie' | 'tv';
  imdbId?: string;
  tmdbId?: number;
  rtUrl?: string;
}

const ExternalLinkBlock: React.FC<ExternalLinkBlockProps> = ({
  imdbId,
  tmdbId,
  rtUrl,
  mediaType,
}) => {
  return (
    <div className="flex justify-end items-center">
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
