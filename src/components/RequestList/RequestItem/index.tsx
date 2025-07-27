import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Tooltip from '@app/components/Common/Tooltip';
import DeclineReasonModal from '@app/components/DeclineReasonModal';
import RequestModal from '@app/components/RequestModal';
import StatusBadge from '@app/components/StatusBadge';
import { useDeclineReasons } from '@app/hooks/useDeclineReasons';
import useDeepLinks from '@app/hooks/useDeepLinks';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import { refreshIntervalHelper } from '@app/utils/refreshIntervalHelper';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

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
  declinewithreason: 'Decline With Reason',
  tmdbid: 'TMDB ID',
  tvdbid: 'TheTVDB ID',
  unknowntitle: 'Unknown Title',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
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
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const textElementRef = useRef<HTMLSpanElement>(null);

  const getDeclineText = (reason: string) =>
    `${intl.formatMessage(globalMessages.declined)} - ${reason}`;

  const checkTruncation = useCallback(() => {
    if (textElementRef.current) {
      const element = textElementRef.current;
      const isOverflowing = element.scrollWidth > element.clientWidth;
      setIsTextTruncated(isOverflowing);
    }
  }, []);

  const setTextElementRef = useCallback(
    (node: HTMLSpanElement | null) => {
      if (textElementRef.current !== node) {
        (
          textElementRef as React.MutableRefObject<HTMLSpanElement | null>
        ).current = node;
        if (node) {
          setTimeout(() => {
            checkTruncation();
          }, 0);
        }
      }
    },
    [checkTruncation]
  );

  useEffect(() => {
    if (requestData?.declineReason) {
      const timeoutId = setTimeout(() => {
        checkTruncation();
      }, 0);

      // Use ResizeObserver to detect when container size changes
      const resizeObserver = new ResizeObserver(() => {
        checkTruncation();
      });

      if (textElementRef.current) {
        resizeObserver.observe(textElementRef.current);
      }

      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
    }
  }, [checkTruncation, requestData?.declineReason]);

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
                    : globalMessages.tvshow
                  : globalMessages.request
              ),
            })}
          </div>
          {requestData && hasPermission(Permission.MANAGE_REQUESTS) && (
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
                  requestData.status === MediaRequestStatus.DECLINED ? (
                    requestData.declineReason ? (
                      <>
                        {isTextTruncated ? (
                          <Tooltip
                            content={getDeclineText(requestData.declineReason)}
                            className="!rounded-full !border-red-700 !bg-red-600 !px-2 !py-1 !text-xs !font-semibold !text-white"
                          >
                            <Badge badgeType="danger" className="min-w-0">
                              <span
                                ref={setTextElementRef}
                                className="truncate"
                              >
                                {getDeclineText(requestData.declineReason)}
                              </span>
                            </Badge>
                          </Tooltip>
                        ) : (
                          <Badge badgeType="danger" className="min-w-0">
                            <span ref={setTextElementRef} className="truncate">
                              {getDeclineText(requestData.declineReason)}
                            </span>
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge badgeType="danger">
                        {intl.formatMessage(globalMessages.declined)}
                      </Badge>
                    )
                  ) : (
                    <Badge badgeType="danger">
                      {intl.formatMessage(globalMessages.failed)}
                    </Badge>
                  )
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
                          <Link href={`/users/${requestData.requestedBy.id}`}>
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
                        <Link href={`/users/${requestData.modifiedBy.id}`}>
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
}

const RequestItem = ({ request, revalidateList }: RequestItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const { addToast } = useToasts();
  const intl = useIntl();
  const { user, hasPermission } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const textElementRef = useRef<HTMLSpanElement>(null);

  useDeclineReasons();

  const getDeclineText = (reason: string) =>
    `${intl.formatMessage(globalMessages.declined)} - ${reason}`;

  const checkTruncation = useCallback(() => {
    if (textElementRef.current) {
      const element = textElementRef.current;
      const isOverflowing = element.scrollWidth > element.clientWidth;
      setIsTextTruncated(isOverflowing);
    }
  }, []);

  const setTextElementRef = useCallback(
    (node: HTMLSpanElement | null) => {
      if (textElementRef.current !== node) {
        (
          textElementRef as React.MutableRefObject<HTMLSpanElement | null>
        ).current = node;
        if (node) {
          setTimeout(() => {
            checkTruncation();
          }, 0);
        }
      }
    },
    [checkTruncation]
  );

  const url =
    request.type === 'movie'
      ? `/api/v1/movie/${request.media.tmdbId}`
      : `/api/v1/tv/${request.media.tmdbId}`;
  const { data: title, error } = useSWR<MovieDetails | TvDetails>(
    inView ? url : null
  );
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

  useEffect(() => {
    if (requestData?.declineReason) {
      const timeoutId = setTimeout(() => {
        checkTruncation();
      }, 0);

      // Use ResizeObserver to detect when container size changes
      const resizeObserver = new ResizeObserver(() => {
        checkTruncation();
      });

      if (textElementRef.current) {
        resizeObserver.observe(textElementRef.current);
      }

      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
    }
  }, [checkTruncation, requestData?.declineReason]);

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
        tmdbId={request.media.tmdbId}
        type={request.type}
        is4k={request.is4k}
        editRequest={request}
        onCancel={() => setShowEditModal(false)}
        onComplete={() => {
          revalidateList();
          setShowEditModal(false);
        }}
      />
      {showDeclineModal && (
        <DeclineReasonModal
          request={requestData}
          onCancel={() => setShowDeclineModal(false)}
          onComplete={() => {
            setShowDeclineModal(false);
            revalidateList();
            mutate('/api/v1/request/count');
          }}
        />
      )}
      <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-gray-800 py-4 text-gray-400 shadow-md ring-1 ring-gray-700 xl:h-28 xl:flex-row">
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
                requestData.type === 'movie'
                  ? `/movie/${requestData.media.tmdbId}`
                  : `/tv/${requestData.media.tmdbId}`
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
                  requestData.type === 'movie'
                    ? `/movie/${requestData.media.tmdbId}`
                    : `/tv/${requestData.media.tmdbId}`
                }
              >
                <a className="mr-2 min-w-0 truncate text-lg font-bold text-white hover:underline xl:text-xl">
                  {isMovie(title) ? title.title : title.name}
                </a>
              </Link>
              {!isMovie(title) && request.seasons.length > 0 && (
                <div className="card-field">
                  <span className="card-field-name">
                    {intl.formatMessage(messages.seasons, {
                      seasonCount:
                        title.seasons.length === request.seasons.length
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
                requestData.declineReason ? (
                  <>
                    {isTextTruncated ? (
                      <Tooltip
                        content={getDeclineText(requestData.declineReason)}
                        className="!rounded-full !border-red-700 !bg-red-600 !px-2 !py-1 !text-xs !font-semibold !text-white"
                      >
                        <Badge badgeType="danger" className="min-w-0">
                          <span ref={setTextElementRef} className="truncate">
                            {getDeclineText(requestData.declineReason)}
                          </span>
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Badge badgeType="danger" className="min-w-0">
                        <span ref={setTextElementRef} className="truncate">
                          {getDeclineText(requestData.declineReason)}
                        </span>
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge badgeType="danger">
                    {intl.formatMessage(globalMessages.declined)}
                  </Badge>
                )
              ) : requestData.status === MediaRequestStatus.FAILED ? (
                <Badge
                  badgeType="danger"
                  href={`/${requestData.type}/${requestData.media.tmdbId}?manage=1`}
                >
                  {intl.formatMessage(globalMessages.failed)}
                </Badge>
              ) : requestData.status === MediaRequestStatus.PENDING &&
                requestData.media[requestData.is4k ? 'status4k' : 'status'] ===
                  MediaStatus.DELETED ? (
                <Badge
                  badgeType="warning"
                  href={`/${requestData.type}/${requestData.media.tmdbId}?manage=1`}
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
                  title={isMovie(title) ? title.title : title.name}
                  inProgress={
                    (
                      requestData.media[
                        requestData.is4k ? 'downloadStatus4k' : 'downloadStatus'
                      ] ?? []
                    ).length > 0
                  }
                  is4k={requestData.is4k}
                  tmdbId={requestData.media.tmdbId}
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
                        <Link href={`/users/${requestData.requestedBy.id}`}>
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
                      <Link href={`/users/${requestData.modifiedBy.id}`}>
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
                <span className="flex w-full">
                  <Button
                    className="flex-grow"
                    buttonType="danger"
                    onClick={() => modifyRequest('decline')}
                  >
                    <XMarkIcon />
                    <span>{intl.formatMessage(globalMessages.decline)}</span>
                  </Button>
                  <Button
                    className="ml-1 w-8 px-2"
                    buttonType="danger"
                    onClick={() => setShowDeclineModal(true)}
                    title={intl.formatMessage(messages.declinewithreason)}
                  >
                    <DocumentTextIcon className="h-4 w-4" />
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
