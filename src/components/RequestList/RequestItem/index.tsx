import React, { useContext, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import type { MediaRequest } from '../../../../server/entity/MediaRequest';
import { useIntl, FormattedRelativeTime, defineMessages } from 'react-intl';
import { useUser, Permission } from '../../../hooks/useUser';
import { LanguageContext } from '../../../context/LanguageContext';
import type { MovieDetails } from '../../../../server/models/Movie';
import type { TvDetails } from '../../../../server/models/Tv';
import useSWR from 'swr';
import Badge from '../../Common/Badge';
import StatusBadge from '../../StatusBadge';
import {
  MediaRequestStatus,
  MediaStatus,
} from '../../../../server/constants/media';
import Button from '../../Common/Button';
import axios from 'axios';
import globalMessages from '../../../i18n/globalMessages';
import Link from 'next/link';
import { useToasts } from 'react-toast-notifications';
import RequestModal from '../../RequestModal';
import ConfirmButton from '../../Common/ConfirmButton';

const messages = defineMessages({
  seasons: '{seasonCount, plural, one {Season} other {Seasons}}',
  all: 'All',
  notavailable: 'N/A',
  failedretry: 'Something went wrong while retrying the request.',
  areyousure: 'Are you sure?',
  status: 'Status',
  requested: 'Requested',
  modified: 'Modified',
  modifieduserdate: '{date} by {user}',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

interface RequestItemProps {
  request: MediaRequest;
  revalidateList: () => void;
}

const RequestItem: React.FC<RequestItemProps> = ({
  request,
  revalidateList,
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const { addToast } = useToasts();
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const { locale } = useContext(LanguageContext);
  const url =
    request.type === 'movie'
      ? `/api/v1/movie/${request.media.tmdbId}`
      : `/api/v1/tv/${request.media.tmdbId}`;
  const { data: title, error } = useSWR<MovieDetails | TvDetails>(
    inView ? `${url}?language=${locale}` : null
  );
  const { data: requestData, revalidate, mutate } = useSWR<MediaRequest>(
    `/api/v1/request/${request.id}`,
    {
      initialData: request,
    }
  );

  const [isRetrying, setRetrying] = useState(false);

  const modifyRequest = async (type: 'approve' | 'decline') => {
    const response = await axios.post(`/api/v1/request/${request.id}/${type}`);

    if (response) {
      revalidate();
    }
  };

  const deleteRequest = async () => {
    await axios.delete(`/api/v1/request/${request.id}`);

    revalidateList();
  };

  const retryRequest = async () => {
    setRetrying(true);

    try {
      const result = await axios.post(`/api/v1/request/${request.id}/retry`);
      mutate(result.data);
    } catch (e) {
      addToast(intl.formatMessage(messages.failedretry), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      setRetrying(false);
    }
  };

  if (!title && !error) {
    return (
      <div
        className="w-full h-64 bg-gray-800 rounded-xl lg:h-32 animate-pulse"
        ref={ref}
      />
    );
  }

  if (!title || !requestData) {
    return (
      <div
        className="w-full h-64 bg-gray-800 rounded-xl lg:h-32 animate-pulse"
        ref={ref}
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
      <div className="relative flex flex-col justify-between w-full py-4 overflow-hidden text-gray-400 bg-gray-800 shadow-md ring-1 ring-gray-700 rounded-xl lg:h-32 lg:flex-row">
        <div
          className="absolute inset-0 z-0 w-full bg-center bg-cover lg:w-2/3"
          style={{
            backgroundImage: title.backdropPath
              ? `linear-gradient(90deg, rgba(31, 41, 55, 0.47) 0%, rgba(31, 41, 55, 1) 100%), url(//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${title.backdropPath})`
              : undefined,
          }}
        />
        <div className="relative flex flex-col justify-between w-full overflow-hidden sm:flex-row">
          <div className="relative z-10 flex items-center w-full pl-4 pr-4 overflow-hidden lg:w-1/2 xl:w-7/12 2xl:w-2/3 sm:pr-0">
            <Link
              href={
                requestData.type === 'movie'
                  ? `/movie/${requestData.media.tmdbId}`
                  : `/tv/${requestData.media.tmdbId}`
              }
            >
              <a className="flex-shrink-0 w-12 h-auto overflow-hidden transition duration-300 scale-100 rounded-md lg:w-14 transform-gpu hover:scale-105">
                <img
                  src={
                    title.posterPath
                      ? `//image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`
                      : '/images/overseerr_poster_not_found.png'
                  }
                  alt=""
                  className="object-cover"
                />
              </a>
            </Link>
            <div className="flex flex-col justify-center pl-2 overflow-hidden lg:pl-4">
              <div className="card-field">
                <Link
                  href={
                    requestData.type === 'movie'
                      ? `/movie/${requestData.media.tmdbId}`
                      : `/tv/${requestData.media.tmdbId}`
                  }
                >
                  <a className="min-w-0 mr-2 text-lg text-white truncate lg:text-xl hover:underline">
                    {isMovie(title) ? title.title : title.name}
                  </a>
                </Link>
              </div>
              <div className="card-field">
                <Link href={`/users/${requestData.requestedBy.id}`}>
                  <a className="flex items-center group">
                    <img
                      src={requestData.requestedBy.avatar}
                      alt=""
                      className="avatar-sm"
                    />
                    <span className="text-sm text-gray-300 truncate group-hover:underline">
                      {requestData.requestedBy.displayName}
                    </span>
                  </a>
                </Link>
              </div>
              {!isMovie(title) && request.seasons.length > 0 && (
                <div className="card-field">
                  <span className="card-field-name">
                    {intl.formatMessage(messages.seasons, {
                      seasonCount:
                        title.seasons.filter(
                          (season) => season.seasonNumber !== 0
                        ).length === request.seasons.length
                          ? 0
                          : request.seasons.length,
                    })}
                  </span>
                  {title.seasons.filter((season) => season.seasonNumber !== 0)
                    .length === request.seasons.length ? (
                    <span className="mr-2 uppercase">
                      <Badge>{intl.formatMessage(messages.all)}</Badge>
                    </span>
                  ) : (
                    <div className="flex overflow-x-scroll hide-scrollbar flex-nowrap">
                      {request.seasons.map((season) => (
                        <span key={`season-${season.id}`} className="mr-2">
                          <Badge>{season.seasonNumber}</Badge>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="z-10 flex flex-col justify-between w-full pr-4 mt-4 ml-4 text-sm sm:ml-2 sm:mt-0 lg:flex-1 lg:pr-0">
            <div className="card-field">
              <span className="card-field-name">
                {intl.formatMessage(messages.status)}
              </span>
              {requestData.media[requestData.is4k ? 'status4k' : 'status'] ===
                MediaStatus.UNKNOWN ||
              requestData.status === MediaRequestStatus.DECLINED ? (
                <Badge badgeType="danger">
                  {requestData.status === MediaRequestStatus.DECLINED
                    ? intl.formatMessage(globalMessages.declined)
                    : intl.formatMessage(globalMessages.failed)}
                </Badge>
              ) : (
                <StatusBadge
                  status={
                    requestData.media[requestData.is4k ? 'status4k' : 'status']
                  }
                  inProgress={
                    (
                      requestData.media[
                        requestData.is4k ? 'downloadStatus4k' : 'downloadStatus'
                      ] ?? []
                    ).length > 0
                  }
                  is4k={requestData.is4k}
                  plexUrl={requestData.media.plexUrl}
                  plexUrl4k={requestData.media.plexUrl4k}
                />
              )}
            </div>
            <div className="card-field">
              <span className="card-field-name">
                {intl.formatMessage(messages.requested)}
              </span>
              <span className="text-gray-300">
                {intl.formatDate(requestData.createdAt)}
              </span>
            </div>
            <div className="card-field">
              <span className="card-field-name">
                {intl.formatMessage(messages.modified)}
              </span>
              <span className="truncate">
                {requestData.modifiedBy ? (
                  <span className="flex text-sm text-gray-300">
                    {intl.formatMessage(messages.modifieduserdate, {
                      date: (
                        <FormattedRelativeTime
                          value={Math.floor(
                            (new Date(requestData.updatedAt).getTime() -
                              Date.now()) /
                              1000
                          )}
                          updateIntervalInSeconds={1}
                        />
                      ),
                      user: (
                        <Link href={`/users/${requestData.modifiedBy.id}`}>
                          <a className="flex items-center group">
                            <img
                              src={requestData.modifiedBy.avatar}
                              alt=""
                              className="ml-1.5 avatar-sm"
                            />
                            <span className="text-sm truncate group-hover:underline">
                              {requestData.modifiedBy.displayName}
                            </span>
                          </a>
                        </Link>
                      ),
                    })}
                  </span>
                ) : (
                  <span className="text-sm text-gray-300">N/A</span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="z-10 flex flex-col justify-between w-full pl-4 pr-4 mt-4 space-y-2 lg:mt-0 lg:items-end lg:justify-around lg:w-96 lg:pl-0">
          {requestData.media[requestData.is4k ? 'status4k' : 'status'] ===
            MediaStatus.UNKNOWN &&
            requestData.status !== MediaRequestStatus.DECLINED &&
            hasPermission(Permission.MANAGE_REQUESTS) && (
              <Button
                className="w-full"
                buttonType="primary"
                disabled={isRetrying}
                onClick={() => retryRequest()}
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18px"
                  height="18px"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
                <span className="block">
                  {intl.formatMessage(globalMessages.retry)}
                </span>
              </Button>
            )}
          {requestData.status !== MediaRequestStatus.PENDING &&
            hasPermission(Permission.MANAGE_REQUESTS) && (
              <ConfirmButton
                onClick={() => deleteRequest()}
                confirmText={intl.formatMessage(messages.areyousure)}
                className="w-full"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="block">
                  {intl.formatMessage(globalMessages.delete)}
                </span>
              </ConfirmButton>
            )}
          {requestData.status === MediaRequestStatus.PENDING &&
            hasPermission(Permission.MANAGE_REQUESTS) && (
              <>
                <div className="flex flex-row w-full space-x-2">
                  <span className="w-full">
                    <Button
                      className="w-full"
                      buttonType="success"
                      onClick={() => modifyRequest('approve')}
                    >
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="block">
                        {intl.formatMessage(globalMessages.approve)}
                      </span>
                    </Button>
                  </span>
                  <span className="w-full">
                    <Button
                      className="w-full"
                      buttonType="danger"
                      onClick={() => modifyRequest('decline')}
                    >
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="block">
                        {intl.formatMessage(globalMessages.decline)}
                      </span>
                    </Button>
                  </span>
                </div>
                <span className="w-full">
                  <Button
                    className="w-full"
                    buttonType="primary"
                    onClick={() => setShowEditModal(true)}
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span className="block">
                      {intl.formatMessage(globalMessages.edit)}
                    </span>
                  </Button>
                </span>
              </>
            )}
        </div>
      </div>
    </>
  );
};

export default RequestItem;
