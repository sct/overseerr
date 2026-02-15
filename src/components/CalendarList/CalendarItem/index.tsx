import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import StatusBadge from '@app/components/StatusBadge';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import {
  FilmIcon,
  InformationCircleIcon,
  TvIcon,
} from '@heroicons/react/24/solid';
import { MediaStatus, MediaType } from '@server/constants/media';
import type { DownloadingItem } from '@server/lib/downloadtracker';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails } from '@server/models/Tv';
import Link from 'next/link';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import FileInfoModal from './FileInfoModal';

const messages = defineMessages({
  episode: 'Episode {episodeNumber}',
  season: 'Season {seasonNumber}',
  airson: 'Airs on',
  releasedon: 'Airs on',
  movie: 'Movie',
  tvshow: 'TV Show',
  fileinfo: 'File Info',
});

interface CalendarItem {
  id: number;
  title: string;
  seriesTitle?: string;
  overview?: string;
  airDate?: string;
  airDateUtc?: string;
  releaseDate?: string;
  mediaType: MediaType;
  tmdbId?: number;
  tvdbId?: number;
  seriesId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  hasFile: boolean;
  monitored: boolean;
  source: 'sonarr' | 'radarr';
  serviceId?: number;
  serviceName?: string;
  downloadStatus?: DownloadingItem[];
}

interface CalendarItemProps {
  item: CalendarItem;
  revalidateList: () => void;
  onFileDeleted?: () => void;
}

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const CalendarItem = ({
  item,
  revalidateList,
  onFileDeleted,
}: CalendarItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const intl = useIntl();
  const { user, hasPermission } = useUser();
  const [showFileInfoModal, setShowFileInfoModal] = useState(false);

  // Everyone can see the File Info button - permissions are checked inside the modal

  // Get TMDB data for poster and details
  const url =
    item.mediaType === MediaType.MOVIE && item.tmdbId
      ? `/api/v1/movie/${item.tmdbId}`
      : item.mediaType === MediaType.TV && item.tmdbId
      ? `/api/v1/tv/${item.tmdbId}`
      : null;

  const { data: title, error } = useSWR<MovieDetails | TvDetails>(
    inView && url ? url : null
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;

    // Handle timezone conversion for air dates
    // Extract just the date part if it's a full timestamp
    const dateOnly = dateString.split('T')[0]; // "2025-08-12T00:00:00Z" -> "2025-08-12"

    // Parse as local date to avoid timezone shifts
    const [year, month, day] = dateOnly.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMediaStatus = (): MediaStatus | undefined => {
    if (item.hasFile) {
      return MediaStatus.AVAILABLE;
    } else if (item.monitored) {
      return MediaStatus.PROCESSING;
    } else {
      return undefined; // No status badge for unmonitored items
    }
  };

  const getSourceDisplayName = (): string => {
    const serviceType =
      item.source.charAt(0).toUpperCase() + item.source.slice(1);
    // Owner user (id === 1) or admin users see the format "CustomServerName(ServiceType)"
    if (
      (user?.id === 1 || hasPermission(Permission.ADMIN)) &&
      item.serviceName &&
      item.serviceName.trim().length > 0
    ) {
      return `${item.serviceName}(${serviceType})`;
    }
    return serviceType;
  };

  // Only show loading skeleton when we actually have a details URL to fetch.
  // If there's no URL (e.g., Sonarr items without tmdbId), render the fallback card immediately
  // instead of an infinite skeleton.
  if (url && !title && !error) {
    return (
      <div
        className="h-32 w-full animate-pulse rounded-xl bg-gray-800 xl:h-28"
        ref={ref}
      />
    );
  }

  // Fallback display when no TMDB data is available
  if (!title) {
    return (
      <>
        {/* File Info Modal */}
        {showFileInfoModal && (
          <FileInfoModal
            itemId={item.id}
            source={item.source}
            mediaType={item.mediaType}
            tmdbId={item.tmdbId}
            serviceId={item.serviceId}
            serviceName={item.serviceName}
            onClose={() => setShowFileInfoModal(false)}
            onFileDeleted={() => {
              revalidateList();
              onFileDeleted?.();
            }}
            itemTitle={item.title}
            seasonNumber={item.seasonNumber}
            episodeNumber={item.episodeNumber}
            downloadStatus={item.downloadStatus}
            isProcessing={(item.downloadStatus ?? []).some(
              (download) =>
                download.sizeLeft > 0 ||
                !['completed', 'imported'].includes(
                  download.status.toLowerCase()
                )
            )}
          />
        )}
        <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-gray-800 py-4 text-gray-400 shadow-md ring-1 ring-gray-700 xl:h-28 xl:flex-row">
          <div className="relative flex w-full flex-col justify-between overflow-hidden sm:flex-row">
            <div className="relative z-10 flex w-full items-center overflow-hidden pl-4 pr-4 sm:pr-0 xl:w-7/12 2xl:w-2/3">
              <div className="relative flex h-auto w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-700">
                {item.mediaType === MediaType.MOVIE ? (
                  <FilmIcon className="h-6 w-6 text-gray-500" />
                ) : (
                  <TvIcon className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="flex flex-col justify-center overflow-hidden pl-2 xl:pl-4">
                <div className="mr-2 min-w-0 truncate text-lg font-bold text-white xl:text-xl">
                  {item.seriesTitle || item.title}
                </div>
                {item.seriesTitle &&
                  item.title &&
                  item.title !== item.seriesTitle && (
                    <div className="flex items-center space-x-2 truncate text-sm text-gray-300">
                      <span>{item.title}</span>
                      {item.source === 'sonarr' &&
                        item.seasonNumber !== undefined &&
                        item.episodeNumber !== undefined && (
                          <Badge>
                            S{item.seasonNumber} E{item.episodeNumber}
                          </Badge>
                        )}
                    </div>
                  )}
              </div>
            </div>
            <div className="z-10 mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:flex-1 xl:pr-0">
              <div className="card-field">
                <span className="card-field-name">
                  {intl.formatMessage(globalMessages.status)}
                </span>
                {getMediaStatus() && (
                  <StatusBadge
                    status={getMediaStatus()}
                    downloadItem={item.downloadStatus}
                    inProgress={(item.downloadStatus ?? []).length > 0}
                    mediaType={
                      item.mediaType === MediaType.MOVIE ? 'movie' : 'tv'
                    }
                    title={item.seriesTitle || item.title}
                  />
                )}
              </div>
              <div className="card-field">
                <span className="card-field-name">
                  {item.source === 'sonarr'
                    ? intl.formatMessage(messages.airson)
                    : intl.formatMessage(messages.releasedon)}
                </span>
                <span className="flex truncate text-sm text-gray-300">
                  {formatDate(item.airDate || item.releaseDate)}
                </span>
              </div>
            </div>
          </div>
          <div className="z-10 mt-4 flex w-full flex-col justify-center space-y-2 pl-4 pr-4 xl:mt-0 xl:w-96 xl:items-end xl:pl-0">
            {(item.hasFile ||
              (item.monitored && (item.downloadStatus ?? []).length > 0)) && (
              <Button
                buttonType="primary"
                className="w-full"
                onClick={() => setShowFileInfoModal(true)}
              >
                <InformationCircleIcon />
                <span>{intl.formatMessage(messages.fileinfo)}</span>
              </Button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* File Info Modal */}
      {showFileInfoModal && (
        <FileInfoModal
          itemId={item.id}
          source={item.source}
          mediaType={item.mediaType}
          tmdbId={item.tmdbId}
          serviceId={item.serviceId}
          serviceName={item.serviceName}
          onClose={() => setShowFileInfoModal(false)}
          onFileDeleted={() => {
            revalidateList();
            onFileDeleted?.();
          }}
          itemTitle={item.title}
          seasonNumber={item.seasonNumber}
          episodeNumber={item.episodeNumber}
          downloadStatus={item.downloadStatus}
          isProcessing={(item.downloadStatus ?? []).some(
            (download) =>
              download.sizeLeft > 0 ||
              !['completed', 'imported'].includes(download.status.toLowerCase())
          )}
        />
      )}
      <div
        data-testid={`calendar-item-${item.source}-${item.id}`}
        className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-gray-800 py-4 text-gray-400 shadow-md ring-1 ring-gray-700 xl:h-28 xl:flex-row"
      >
        {title.backdropPath && (
          <div className="absolute inset-0 z-0 w-full bg-cover bg-center xl:w-2/3">
            <CachedImage
              src={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${title.backdropPath}`}
              alt=""
              layout="fill"
              objectFit="cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgba(31, 41, 55, 0.47) 0%, rgba(31, 41, 55, 1) 100%)',
              }}
            />
          </div>
        )}
        <div className="relative flex w-full flex-col justify-between overflow-hidden sm:flex-row">
          <div className="relative z-10 flex w-full items-center overflow-hidden pl-4 pr-4 sm:pr-0 xl:w-7/12 2xl:w-2/3">
            <Link
              href={
                item.mediaType === MediaType.MOVIE
                  ? `/movie/${item.tmdbId}`
                  : `/tv/${item.tmdbId}`
              }
            >
              <a className="relative h-auto w-12 flex-shrink-0 scale-100 transform-gpu overflow-hidden rounded-md transition duration-300 hover:scale-105">
                <CachedImage
                  src={
                    title.posterPath
                      ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`
                      : '/images/overseerr_poster_not_found.png'
                  }
                  alt=""
                  layout="responsive"
                  width={600}
                  height={900}
                  objectFit="cover"
                />
              </a>
            </Link>
            <div className="flex flex-col justify-center overflow-hidden pl-2 xl:pl-4">
              <div className="pt-0.5 text-xs font-medium text-white sm:pt-1">
                {(isMovie(title)
                  ? title.releaseDate
                  : title.firstAirDate
                )?.slice(0, 4)}
              </div>
              <Link
                href={
                  item.mediaType === MediaType.MOVIE
                    ? `/movie/${item.tmdbId}`
                    : `/tv/${item.tmdbId}`
                }
              >
                <a className="mr-2 min-w-0 truncate text-lg font-bold text-white hover:underline xl:text-xl">
                  {isMovie(title) ? title.title : title.name}
                </a>
              </Link>
              {item.title &&
                item.title !== (isMovie(title) ? title.title : title.name) && (
                  <div className="flex items-center space-x-2 truncate text-sm text-gray-300">
                    <span>{item.title}</span>
                    {item.source === 'sonarr' &&
                      item.seasonNumber !== undefined &&
                      item.episodeNumber !== undefined && (
                        <Badge>
                          S{item.seasonNumber} E{item.episodeNumber}
                        </Badge>
                      )}
                  </div>
                )}
            </div>
          </div>
          <div className="z-10 mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:flex-1 xl:pr-0">
            <div className="card-field">
              <span className="card-field-name">
                {intl.formatMessage(globalMessages.status)}
              </span>
              {getMediaStatus() && (
                <StatusBadge
                  status={getMediaStatus()}
                  downloadItem={item.downloadStatus}
                  inProgress={(item.downloadStatus ?? []).length > 0}
                  mediaType={
                    item.mediaType === MediaType.MOVIE ? 'movie' : 'tv'
                  }
                  title={
                    title
                      ? isMovie(title)
                        ? title.title
                        : title.name
                      : item.seriesTitle || item.title
                  }
                />
              )}
            </div>
            <div className="card-field">
              <span className="card-field-name">
                {item.source === 'sonarr'
                  ? intl.formatMessage(messages.airson)
                  : intl.formatMessage(messages.releasedon)}
              </span>
              <span className="flex truncate text-sm text-gray-300">
                {formatDate(item.airDate || item.releaseDate)}
              </span>
            </div>
            <div className="card-field">
              <span className="card-field-name">Source</span>
              <div className="flex items-center space-x-1">
                {item.source === 'sonarr' ? (
                  <TvIcon className="h-4 w-4 text-indigo-400" />
                ) : (
                  <FilmIcon className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-sm">{getSourceDisplayName()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="z-10 mt-4 flex w-full flex-col justify-center space-y-2 pl-4 pr-4 xl:mt-0 xl:w-96 xl:items-end xl:pl-0">
          {(item.hasFile ||
            (item.monitored && (item.downloadStatus ?? []).length > 0)) && (
            <Button
              buttonType="primary"
              className="w-full"
              onClick={() => setShowFileInfoModal(true)}
            >
              <InformationCircleIcon />
              <span>{intl.formatMessage(messages.fileinfo)}</span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CalendarItem;
