import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import RequestModal from '@app/components/RequestModal';
import StatusBadge from '@app/components/StatusBadge';
import useDeepLinks from '@app/hooks/useDeepLinks';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import { refreshIntervalHelper } from '@app/utils/refreshIntervalHelper';
import {
  ArrowPathIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import Link from 'next/link';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

// Music detail interfaces
interface ArtistDetails {
  id: string;
  name: string;
  disambiguation?: string;
  country?: string;
  type?: string;
  area?: { id: string; name: string };
  lifeSpan?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
}

interface AlbumDetails {
  id: string;
  title: string;
  disambiguation?: string;
  firstReleaseDate?: string;
  primaryType?: string;
}

type RequestTitle = MovieDetails | TvDetails | ArtistDetails | AlbumDetails;

const messages = defineMessages({
  seasons: '{seasonCount, plural, one {Season} other {Seasons}}',
  failedretry: 'Something went wrong while retrying the request.',
  requested: 'Requested',
  requesteddate: 'Requested',
  modified: 'Modified',
  modifieduserdate: '{date} by {user}',
  mediaerror: '{mediaType} Not Found',
  editrequest: 'Edit Request',
  deleterequest: 'Delete Request',
  cancelRequest: 'Cancel Request',
  tmdbid: 'TMDB ID',
  tvdbid: 'TheTVDB ID',
  mbid: 'MusicBrainz ID',
  unknowntitle: 'Unknown Title',
});

const isMovie = (media: RequestTitle): media is MovieDetails => {
  return (media as MovieDetails).title !== undefined && 'tmdbId' in media;
};

const isArtist = (media: RequestTitle): media is ArtistDetails => {
  return (media as ArtistDetails).name !== undefined && !('tmdbId' in media);
};

const isAlbum = (media: RequestTitle): media is AlbumDetails => {
  return (media as AlbumDetails).title !== undefined && !('tmdbId' in media);
};

const isArtistLegacy = (
  item: MovieDetails | TvDetails | ArtistDetails | AlbumDetails
): item is ArtistDetails => {
  return (
    (item as ArtistDetails).name !== undefined &&
    'id' in item &&
    typeof item.id === 'string'
  );
};

const isAlbumLegacy = (
  item: MovieDetails | TvDetails | ArtistDetails | AlbumDetails
): item is AlbumDetails => {
  return (
    (item as AlbumDetails).title !== undefined &&
    'id' in item &&
    typeof item.id === 'string'
  );
};

interface RequestItemErrorProps {
  requestData?: MediaRequest;
  revalidateList: () => void;
}

const RequestItemError = ({
  requestData,
  revalidateList,
}: RequestItemErrorProps) => {
  const intl = useIntl();
  const { hasPermission } = useUser();

  const deleteRequest = async () => {
    await axios.delete(`/api/v1/media/${requestData?.media.id}`);
    revalidateList();
    mutate('/api/v1/request/count');
  };

  const { plexUrl, plexUrl4k } = useDeepLinks({
    plexUrl: requestData?.media?.plexUrl,
    plexUrl4k: requestData?.media?.plexUrl4k,
    iOSPlexUrl: requestData?.media?.iOSPlexUrl,
    iOSPlexUrl4k: requestData?.media?.iOSPlexUrl4k,
  });

  return (
    <div className="flex h-64 w-full flex-col justify-center rounded-xl bg-gray-800 py-4 text-gray-400 shadow-md ring-1 ring-red-500 xl:h-28 xl:flex-row">
      <div className="flex w-full flex-col justify-between overflow-hidden sm:flex-row">
        <div className="flex w-full flex-col justify-center overflow-hidden pl-4 pr-4 sm:pr-0 xl:w-7/12 2xl:w-2/3">
          <div className="flex text-lg font-bold text-white xl:text-xl">
            {intl.formatMessage(messages.mediaerror, {
              mediaType: intl.formatMessage(
                requestData?.type
                  ? requestData?.type === 'movie'
                    ? globalMessages.movie
                    : requestData?.type === 'tv'
                    ? globalMessages.tvshow
                    : requestData?.type === 'artist'
                    ? globalMessages.artist
                    : requestData?.type === 'album'
                    ? globalMessages.album
                    : globalMessages.request
                  : globalMessages.request
              ),
            })}
          </div>
          {requestData && hasPermission(Permission.MANAGE_REQUESTS) && (
            <>
              {requestData.type === 'artist' || requestData.type === 'album' ? (
                <div className="card-field">
                  <span className="card-field-name">
                    {intl.formatMessage(messages.mbid)}
                  </span>
                  <span className="flex truncate text-sm text-gray-300">
                    {requestData.media.musicBrainzId}
                  </span>
                </div>
              ) : (
                <>
                  <div className="card-field">
                    <span className="card-field-name">
                      {intl.formatMessage(messages.tmdbid)}
                    </span>
                    <span className="flex truncate text-sm text-gray-300">
                      {requestData.media.tmdbId}
                    </span>
                  </div>
                  {requestData.media.tvdbId && (
                    <div className="card-field">
                      <span className="card-field-name">
                        {intl.formatMessage(messages.tvdbid)}
                      </span>
                      <span className="flex truncate text-sm text-gray-300">
                        {requestData?.media.tvdbId}
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <div className="mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:flex-1 xl:pr-0">
          {requestData && (
            <>
              <div className="card-field">
                <span className="card-field-name">
                  {intl.formatMessage(globalMessages.status)}
                </span>
                {requestData.status === MediaRequestStatus.DECLINED ||
                requestData.status === MediaRequestStatus.FAILED ? (
                  <Badge badgeType="danger">
                    {requestData.status === MediaRequestStatus.DECLINED
                      ? intl.formatMessage(globalMessages.declined)
                      : intl.formatMessage(globalMessages.failed)}
                  </Badge>
                ) : (
                  <StatusBadge
                    status={
                      requestData.media[
                        requestData.is4k ? 'status4k' : 'status'
                      ]
                    }
                    downloadItem={
                      requestData.media[
                        requestData.is4k ? 'downloadStatus4k' : 'downloadStatus'
                      ]
                    }
                    title={intl.formatMessage(messages.unknowntitle)}
                    inProgress={
                      (
                        requestData.media[
                          requestData.is4k
                            ? 'downloadStatus4k'
                            : 'downloadStatus'
                        ] ?? []
                      ).length > 0
                    }
                    is4k={requestData.is4k}
                    tmdbId={
                      requestData.type === 'artist' ||
                      requestData.type === 'album'
                        ? undefined
                        : requestData.media.tmdbId
                    }
                    mbid={
                      requestData.type === 'artist' ||
                      requestData.type === 'album'
                        ? requestData.media.musicBrainzId
                        : undefined
                    }
                    mediaType={requestData.type}
                    plexUrl={requestData.is4k ? plexUrl4k : plexUrl}
                    serviceUrl={
                      requestData.is4k
                        ? requestData.media.serviceUrl4k
                        : requestData.media.serviceUrl
                    }
                  />
                )}
              </div>
              <div className="card-field">
                {hasPermission(
                  [Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW],
                  { type: 'or' }
                ) ? (
                  <>
                    <span className="card-field-name">
                      {intl.formatMessage(messages.requested)}
                    </span>
                    <span className="flex truncate text-sm text-gray-300">
                      {intl.formatMessage(messages.modifieduserdate, {
                        date: (
                          <FormattedRelativeTime
                            value={Math.floor(
                              (new Date(requestData.createdAt).getTime() -
                                Date.now()) /
                                1000
                            )}
                            updateIntervalInSeconds={1}
                            numeric="auto"
                          />
                        ),
                        user: (
                          <Link
                            href={`/users/${requestData.requestedBy.id}`}
                            legacyBehavior
                          >
                            <a className="group flex items-center truncate">
                              <img
                                src={requestData.requestedBy.avatar}
                                alt=""
                                className="avatar-sm ml-1.5"
                              />
                              <span className="truncate text-sm group-hover:underline">
                                {requestData.requestedBy.displayName}
                              </span>
                            </a>
                          </Link>
                        ),
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="card-field-name">
                      {intl.formatMessage(messages.requesteddate)}
                    </span>
                    <span className="flex truncate text-sm text-gray-300">
                      <FormattedRelativeTime
                        value={Math.floor(
                          (new Date(requestData.createdAt).getTime() -
                            Date.now()) /
                            1000
                        )}
                        updateIntervalInSeconds={1}
                        numeric="auto"
                      />
                    </span>
                  </>
                )}
              </div>
              {requestData.modifiedBy && (
                <div className="card-field">
                  <span className="card-field-name">
                    {intl.formatMessage(messages.modified)}
                  </span>
                  <span className="flex truncate text-sm text-gray-300">
                    {intl.formatMessage(messages.modifieduserdate, {
                      date: (
                        <FormattedRelativeTime
                          value={Math.floor(
                            (new Date(requestData.updatedAt).getTime() -
                              Date.now()) /
                              1000
                          )}
                          updateIntervalInSeconds={1}
                          numeric="auto"
                        />
                      ),
                      user: (
                        <Link
                          href={`/users/${requestData.modifiedBy.id}`}
                          legacyBehavior
                        >
                          <a className="group flex items-center truncate">
                            <img
                              src={requestData.modifiedBy.avatar}
                              alt=""
                              className="avatar-sm ml-1.5"
                            />
                            <span className="truncate text-sm group-hover:underline">
                              {requestData.modifiedBy.displayName}
                            </span>
                          </a>
                        </Link>
                      ),
                    })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="z-10 mt-4 flex w-full flex-col justify-center pl-4 pr-4 xl:mt-0 xl:w-96 xl:items-end xl:pl-0">
        {hasPermission(Permission.MANAGE_REQUESTS) && requestData?.media.id && (
          <Button
            className="w-full"
            buttonType="danger"
            onClick={() => deleteRequest()}
          >
            <TrashIcon />
            <span>{intl.formatMessage(messages.deleterequest)}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

interface RequestItemProps {
  request: MediaRequest;
  revalidateList: () => void;
  showSelection?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}

const RequestItem = ({
  request,
  revalidateList,
  showSelection,
  selected,
  onSelectedChange,
}: RequestItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const { addToast } = useToasts();
  const intl = useIntl();
  const { user, hasPermission } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);

  const requestType = request.type === 'music' ? 'artist' : request.type;

  // Determine URL based on request type
  const isMusicRequest = requestType === 'artist' || requestType === 'album';
  const url = isMusicRequest
    ? requestType === 'artist'
      ? `/api/v1/music/artist/${request.media.musicBrainzId}`
      : `/api/v1/music/album/${request.media.musicBrainzId}`
    : requestType === 'movie'
    ? `/api/v1/movie/${request.media.tmdbId}`
    : `/api/v1/tv/${request.media.tmdbId}`;

  const { data: title, error } = useSWR<
    MovieDetails | TvDetails | ArtistDetails | AlbumDetails
  >(inView ? url : null);
  const { data: requestData, mutate: revalidate } = useSWR<MediaRequest>(
    `/api/v1/request/${request.id}`,
    {
      fallbackData: request,
      refreshInterval: refreshIntervalHelper(
        {
          downloadStatus: request.media.downloadStatus,
          downloadStatus4k: request.media.downloadStatus4k,
        },
        15000
      ),
    }
  );

  const [isRetrying, setRetrying] = useState(false);

  const modifyRequest = async (type: 'approve' | 'decline') => {
    const response = await axios.post(`/api/v1/request/${request.id}/${type}`);

    if (response) {
      revalidate();
      mutate('/api/v1/request/count');
    }
  };

  const deleteRequest = async () => {
    await axios.delete(`/api/v1/request/${request.id}`);

    revalidateList();
    mutate('/api/v1/request/count');
  };

  const retryRequest = async () => {
    setRetrying(true);

    try {
      const result = await axios.post(`/api/v1/request/${request.id}/retry`);
      revalidate(result.data);
    } catch (e) {
      addToast(intl.formatMessage(messages.failedretry), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      setRetrying(false);
    }
  };

  const { plexUrl, plexUrl4k } = useDeepLinks({
    plexUrl: requestData?.media?.plexUrl,
    plexUrl4k: requestData?.media?.plexUrl4k,
    iOSPlexUrl: requestData?.media?.iOSPlexUrl,
    iOSPlexUrl4k: requestData?.media?.iOSPlexUrl4k,
  });

  if (!title && !error) {
    return (
      <div
        className="h-64 w-full animate-pulse rounded-xl bg-gray-800 xl:h-28"
        ref={ref}
      />
    );
  }

  if (!title || !requestData) {
    return (
      <RequestItemError
        requestData={requestData}
        revalidateList={revalidateList}
      />
    );
  }

  return (
    <>
      <RequestModal
        show={showEditModal}
        tmdbId={isMusicRequest ? undefined : request.media.tmdbId}
        mbid={isMusicRequest ? request.media.musicBrainzId : undefined}
        type={requestType}
        is4k={request.is4k}
        editRequest={request}
        onCancel={() => setShowEditModal(false)}
        onComplete={() => {
          revalidateList();
          setShowEditModal(false);
        }}
      />
      <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-gray-800 py-4 text-gray-400 shadow-md ring-1 ring-gray-700 xl:h-28 xl:flex-row">
        {showSelection && (
          <div className="absolute left-3 top-3 z-20">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-500 bg-gray-900 text-indigo-500 focus:ring-indigo-500"
              checked={!!selected}
              onChange={(e) => onSelectedChange?.(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select request"
            />
          </div>
        )}
        {!isMusicRequest &&
          title &&
          'backdropPath' in title &&
          title.backdropPath && (
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
                isMusicRequest
                  ? requestData.type === 'artist'
                    ? `/artist/${requestData.media.musicBrainzId}`
                    : `/album/${requestData.media.musicBrainzId}`
                  : requestData.type === 'movie'
                  ? `/movie/${requestData.media.tmdbId}`
                  : `/tv/${requestData.media.tmdbId}`
              }
              legacyBehavior
            >
              <a className="relative h-auto w-12 flex-shrink-0 scale-100 transform-gpu overflow-hidden rounded-md transition duration-300 hover:scale-105">
                <CachedImage
                  src={
                    isMusicRequest
                      ? '/images/overseerr_poster_not_found.png'
                      : 'posterPath' in title && title.posterPath
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
                {isMusicRequest
                  ? isAlbum(title)
                    ? title.firstReleaseDate?.slice(0, 4)
                    : isArtist(title) && title.lifeSpan?.begin
                    ? title.lifeSpan.begin.slice(0, 4)
                    : null
                  : (isMovie(title)
                      ? title.releaseDate
                      : (title as TvDetails).firstAirDate
                    )?.slice(0, 4)}
              </div>
              <Link
                href={
                  isMusicRequest
                    ? requestData.type === 'artist'
                      ? `/artist/${requestData.media.musicBrainzId}`
                      : `/album/${requestData.media.musicBrainzId}`
                    : requestData.type === 'movie'
                    ? `/movie/${requestData.media.tmdbId}`
                    : `/tv/${requestData.media.tmdbId}`
                }
                legacyBehavior
              >
                <a className="mr-2 min-w-0 truncate text-lg font-bold text-white hover:underline xl:text-xl">
                  {isMusicRequest
                    ? isArtist(title)
                      ? title.name
                      : isAlbum(title)
                      ? title.title
                      : intl.formatMessage(messages.unknowntitle)
                    : isMovie(title)
                    ? title.title
                    : (title as TvDetails).name}
                </a>
              </Link>
              {!isMovie(title) &&
                !isMusicRequest &&
                request.seasons.length > 0 && (
                  <div className="card-field">
                    <span className="card-field-name">
                      {intl.formatMessage(messages.seasons, {
                        seasonCount:
                          (title as TvDetails).seasons.length ===
                            request.seasons.length
                            ? 0
                            : request.seasons.length,
                      })}
                    </span>
                    <div className="hide-scrollbar flex flex-nowrap overflow-x-scroll">
                      {request.seasons.map((season) => (
                        <span key={`season-${season.id}`} className="mr-2">
                          <Badge>
                            {season.seasonNumber === 0
                              ? intl.formatMessage(globalMessages.specials)
                              : season.seasonNumber}
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
          <div className="z-10 mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:flex-1 xl:pr-0">
            <div className="card-field">
              <span className="card-field-name">
                {intl.formatMessage(globalMessages.status)}
              </span>
              {requestData.status === MediaRequestStatus.DECLINED ? (
                <Badge badgeType="danger">
                  {intl.formatMessage(globalMessages.declined)}
                </Badge>
              ) : requestData.status === MediaRequestStatus.FAILED ? (
                <Badge
                  badgeType="danger"
                  href={
                    isMusicRequest
                      ? `/${requestData.type}/${requestData.media.musicBrainzId}?manage=1`
                      : `/${requestData.type}/${requestData.media.tmdbId}?manage=1`
                  }
                >
                  {intl.formatMessage(globalMessages.failed)}
                </Badge>
              ) : requestData.status === MediaRequestStatus.PENDING &&
                requestData.media[requestData.is4k ? 'status4k' : 'status'] ===
                  MediaStatus.DELETED ? (
                <Badge
                  badgeType="warning"
                  href={
                    isMusicRequest
                      ? `/${requestData.type}/${requestData.media.musicBrainzId}?manage=1`
                      : `/${requestData.type}/${requestData.media.tmdbId}?manage=1`
                  }
                >
                  {intl.formatMessage(globalMessages.pending)}
                </Badge>
              ) : (
                <StatusBadge
                  status={
                    requestData.media[requestData.is4k ? 'status4k' : 'status']
                  }
                  downloadItem={
                    requestData.media[
                      requestData.is4k ? 'downloadStatus4k' : 'downloadStatus'
                    ]
                  }
                  title={
                    isMusicRequest
                      ? isArtist(title)
                        ? title.name
                        : isAlbum(title)
                        ? title.title
                        : intl.formatMessage(messages.unknowntitle)
                      : isMovie(title)
                      ? title.title
                      : (title as TvDetails).name
                  }
                  inProgress={
                    (
                      requestData.media[
                        requestData.is4k ? 'downloadStatus4k' : 'downloadStatus'
                      ] ?? []
                    ).length > 0
                  }
                  is4k={requestData.is4k}
                  tmdbId={isMusicRequest ? undefined : requestData.media.tmdbId}
                  mbid={
                    isMusicRequest ? requestData.media.musicBrainzId : undefined
                  }
                  mediaType={requestData.type}
                  plexUrl={requestData.is4k ? plexUrl4k : plexUrl}
                  serviceUrl={
                    requestData.is4k
                      ? requestData.media.serviceUrl4k
                      : requestData.media.serviceUrl
                  }
                />
              )}
            </div>
            <div className="card-field">
              {hasPermission(
                [Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW],
                { type: 'or' }
              ) ? (
                <>
                  <span className="card-field-name">
                    {intl.formatMessage(messages.requested)}
                  </span>
                  <span className="flex truncate text-sm text-gray-300">
                    {intl.formatMessage(messages.modifieduserdate, {
                      date: (
                        <FormattedRelativeTime
                          value={Math.floor(
                            (new Date(requestData.createdAt).getTime() -
                              Date.now()) /
                              1000
                          )}
                          updateIntervalInSeconds={1}
                          numeric="auto"
                        />
                      ),
                      user: (
                        <Link
                          href={`/users/${requestData.requestedBy.id}`}
                          legacyBehavior
                        >
                          <a className="group flex items-center truncate">
                            <img
                              src={requestData.requestedBy.avatar}
                              alt=""
                              className="avatar-sm ml-1.5 object-cover"
                            />
                            <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                              {requestData.requestedBy.displayName}
                            </span>
                          </a>
                        </Link>
                      ),
                    })}
                  </span>
                </>
              ) : (
                <>
                  <span className="card-field-name">
                    {intl.formatMessage(messages.requesteddate)}
                  </span>
                  <span className="flex truncate text-sm text-gray-300">
                    <FormattedRelativeTime
                      value={Math.floor(
                        (new Date(requestData.createdAt).getTime() -
                          Date.now()) /
                          1000
                      )}
                      updateIntervalInSeconds={1}
                      numeric="auto"
                    />
                  </span>
                </>
              )}
            </div>
            {requestData.modifiedBy && (
              <div className="card-field">
                <span className="card-field-name">
                  {intl.formatMessage(messages.modified)}
                </span>
                <span className="flex truncate text-sm text-gray-300">
                  {intl.formatMessage(messages.modifieduserdate, {
                    date: (
                      <FormattedRelativeTime
                        value={Math.floor(
                          (new Date(requestData.updatedAt).getTime() -
                            Date.now()) /
                            1000
                        )}
                        updateIntervalInSeconds={1}
                        numeric="auto"
                      />
                    ),
                    user: (
                      <Link
                        href={`/users/${requestData.modifiedBy.id}`}
                        legacyBehavior
                      >
                        <a className="group flex items-center truncate">
                          <img
                            src={requestData.modifiedBy.avatar}
                            alt=""
                            className="avatar-sm ml-1.5 object-cover"
                          />
                          <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                            {requestData.modifiedBy.displayName}
                          </span>
                        </a>
                      </Link>
                    ),
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="z-10 mt-4 flex w-full flex-col justify-center space-y-2 pl-4 pr-4 xl:mt-0 xl:w-96 xl:items-end xl:pl-0">
          {requestData.status === MediaRequestStatus.FAILED &&
            hasPermission(Permission.MANAGE_REQUESTS) && (
              <Button
                className="w-full"
                buttonType="primary"
                disabled={isRetrying}
                onClick={() => retryRequest()}
              >
                <ArrowPathIcon
                  className={isRetrying ? 'animate-spin' : ''}
                  style={{ animationDirection: 'reverse' }}
                />
                <span>
                  {intl.formatMessage(
                    isRetrying ? globalMessages.retrying : globalMessages.retry
                  )}
                </span>
              </Button>
            )}
          {requestData.status !== MediaRequestStatus.PENDING &&
            hasPermission(Permission.MANAGE_REQUESTS) && (
              <ConfirmButton
                onClick={() => deleteRequest()}
                confirmText={intl.formatMessage(globalMessages.areyousure)}
                className="w-full"
              >
                <TrashIcon />
                <span>{intl.formatMessage(messages.deleterequest)}</span>
              </ConfirmButton>
            )}
          {requestData.status === MediaRequestStatus.PENDING &&
            hasPermission(Permission.MANAGE_REQUESTS) && (
              <div className="flex w-full flex-row space-x-2">
                <span className="w-full">
                  <Button
                    className="w-full"
                    buttonType="success"
                    onClick={() => modifyRequest('approve')}
                  >
                    <CheckIcon />
                    <span>{intl.formatMessage(globalMessages.approve)}</span>
                  </Button>
                </span>
                <span className="w-full">
                  <Button
                    className="w-full"
                    buttonType="danger"
                    onClick={() => modifyRequest('decline')}
                  >
                    <XMarkIcon />
                    <span>{intl.formatMessage(globalMessages.decline)}</span>
                  </Button>
                </span>
              </div>
            )}
          {requestData.status === MediaRequestStatus.PENDING &&
            (hasPermission(Permission.MANAGE_REQUESTS) ||
              (requestData.requestedBy.id === user?.id &&
                (requestData.type === 'tv' ||
                  hasPermission(Permission.REQUEST_ADVANCED)))) && (
              <span className="w-full">
                <Button
                  className="w-full"
                  buttonType="primary"
                  onClick={() => setShowEditModal(true)}
                >
                  <PencilIcon />
                  <span>{intl.formatMessage(messages.editrequest)}</span>
                </Button>
              </span>
            )}
          {requestData.status === MediaRequestStatus.PENDING &&
            !hasPermission(Permission.MANAGE_REQUESTS) &&
            requestData.requestedBy.id === user?.id && (
              <ConfirmButton
                onClick={() => deleteRequest()}
                confirmText={intl.formatMessage(globalMessages.areyousure)}
                className="w-full"
              >
                <XMarkIcon />
                <span>{intl.formatMessage(messages.cancelRequest)}</span>
              </ConfirmButton>
            )}
        </div>
      </div>
    </>
  );
};

export default RequestItem;
