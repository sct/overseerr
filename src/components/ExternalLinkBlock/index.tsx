import ImdbLogo from '@app/assets/services/imdb.svg';
import PlexLogo from '@app/assets/services/plex.svg';
import RTLogo from '@app/assets/services/rt.svg';
import TmdbLogo from '@app/assets/services/tmdb.svg';
import TraktLogo from '@app/assets/services/trakt.svg';
import TvdbLogo from '@app/assets/services/tvdb.svg';
import useLocale from '@app/hooks/useLocale';
import { MediaType } from '@server/constants/media';

interface ExternalLinkBlockProps {
  mediaType: 'movie' | 'tv' | 'artist' | 'album';
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
  rtUrl?: string;
  plexUrl?: string;
  mbid?: string; // MusicBrainz ID for music types
  serviceUrl?: string; // Lidarr URL for music types
}

const ExternalLinkBlock = ({
  mediaType,
  tmdbId,
  tvdbId,
  imdbId,
  rtUrl,
  plexUrl,
  mbid,
  serviceUrl,
}: ExternalLinkBlockProps) => {
  const { locale } = useLocale();

  return (
    <div className="flex w-full items-center justify-center space-x-5">
      {plexUrl && (
        <a
          href={plexUrl}
          className="w-12 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <PlexLogo />
        </a>
      )}
      {serviceUrl && (mediaType === 'artist' || mediaType === 'album') && (
        <a
          href={serviceUrl}
          className="w-8 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
          title="Open in Lidarr"
        >
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </a>
      )}
      {mbid && (mediaType === 'artist' || mediaType === 'album') && (
        <a
          href={`https://musicbrainz.org/${mediaType === 'artist' ? 'artist' : 'release-group'}/${mbid}`}
          className="w-8 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
          title="Open in MusicBrainz"
        >
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </a>
      )}
      {tmdbId && mediaType !== 'artist' && mediaType !== 'album' && (
        <a
          href={`https://www.themoviedb.org/${mediaType}/${tmdbId}?language=${locale}`}
          className="w-8 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <TmdbLogo />
        </a>
      )}
      {tvdbId && mediaType === MediaType.TV && (
        <a
          href={`http://www.thetvdb.com/?tab=series&id=${tvdbId}`}
          className="w-9 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <TvdbLogo />
        </a>
      )}
      {imdbId && (
        <a
          href={`https://www.imdb.com/title/${imdbId}`}
          className="w-8 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <ImdbLogo />
        </a>
      )}
      {rtUrl && (
        <a
          href={rtUrl}
          className="w-14 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <RTLogo />
        </a>
      )}
      {tmdbId && mediaType !== 'artist' && mediaType !== 'album' && (
        <a
          href={`https://trakt.tv/search/tmdb/${tmdbId}?id_type=${
            mediaType === 'movie' ? 'movie' : 'show'
          }`}
          className="w-8 opacity-50 transition duration-300 hover:opacity-100"
          target="_blank"
          rel="noreferrer"
        >
          <TraktLogo />
        </a>
      )}
    </div>
  );
};

export default ExternalLinkBlock;
