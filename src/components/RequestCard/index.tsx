import React, { useContext, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { TvDetails } from '../../../server/models/Tv';
import type { MovieDetails } from '../../../server/models/Movie';
import useSWR from 'swr';
import { LanguageContext } from '../../context/LanguageContext';
import {
  MediaRequestStatus,
  MediaStatus,
} from '../../../server/constants/media';
import Badge from '../Common/Badge';
import { useUser, Permission } from '../../hooks/useUser';
import axios from 'axios';
import Button from '../Common/Button';
import { withProperties } from '../../utils/typeHelpers';
import Link from 'next/link';
import { defineMessages, useIntl } from 'react-intl';
import globalMessages from '../../i18n/globalMessages';
import StatusBadge from '../StatusBadge';

const messages = defineMessages({
  status: 'Status',
  seasons: 'Seasons',
  all: 'All',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const RequestCardPlaceholder: React.FC = () => {
  return (
    <div className="relative p-4 bg-gray-700 rounded-xl w-72 sm:w-96 animate-pulse">
      <div className="w-20 sm:w-28">
        <div className="w-full" style={{ paddingBottom: '150%' }} />
      </div>
    </div>
  );
};

interface RequestCardProps {
  request: MediaRequest;
  onTitleData?: (requestId: number, title: MovieDetails | TvDetails) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onTitleData }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const intl = useIntl();
  const { hasPermission } = useUser();
  const { locale } = useContext(LanguageContext);
  const url =
    request.type === 'movie'
      ? `/api/v1/movie/${request.media.tmdbId}`
      : `/api/v1/tv/${request.media.tmdbId}`;
  const { data: title, error } = useSWR<MovieDetails | TvDetails>(
    inView ? `${url}?language=${locale}` : null
  );
  const {
    data: requestData,
    error: requestError,
    revalidate,
  } = useSWR<MediaRequest>(`/api/v1/request/${request.id}`, {
    initialData: request,
  });

  const modifyRequest = async (type: 'approve' | 'decline') => {
    const response = await axios.post(`/api/v1/request/${request.id}/${type}`);

    if (response) {
      revalidate();
    }
  };

  useEffect(() => {
    if (title && onTitleData) {
      onTitleData(request.id, title);
    }
  }, [title, onTitleData, request]);

  if (!title && !error) {
    return (
      <div ref={ref}>
        <RequestCardPlaceholder />
      </div>
    );
  }

  if (!requestData && !requestError) {
    return <RequestCardPlaceholder />;
  }

  if (!title || !requestData) {
    return <RequestCardPlaceholder />;
  }

  return (
    <div
      className="relative flex p-4 text-gray-400 bg-gray-800 bg-center bg-cover rounded-xl w-72 sm:w-96"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%), url(//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${title.backdropPath})`,
      }}
    >
      <div className="flex flex-col flex-1 min-w-0 pr-4">
        <Link
          href={
            request.type === 'movie'
              ? `/movie/${requestData.media.tmdbId}`
              : `/tv/${requestData.media.tmdbId}`
          }
        >
          <a className="pb-0.5 sm:pb-1 overflow-hidden text-base text-white cursor-pointer sm:text-lg overflow-ellipsis whitespace-nowrap hover:underline">
            {isMovie(title) ? title.title : title.name}
          </a>
        </Link>
        <div className="card-field">
          <Link href={`/users/${requestData.requestedBy.id}`}>
            <a className="flex items-center group">
              <img
                src={requestData.requestedBy.avatar}
                alt=""
                className="avatar-sm"
              />
              <span className="truncate group-hover:underline">
                {requestData.requestedBy.displayName}
              </span>
            </a>
          </Link>
        </div>
        {request.seasons.length > 0 && (
          <div className="sm:flex items-center my-0.5 sm:my-1 text-sm hidden">
            <span className="mr-2 font-medium">
              {intl.formatMessage(messages.seasons)}
            </span>
            {!isMovie(title) &&
            title.seasons.filter((season) => season.seasonNumber !== 0)
              .length === request.seasons.length ? (
              <span className="mr-2 uppercase">
                <Badge>{intl.formatMessage(messages.all)}</Badge>
              </span>
            ) : (
              <div className="overflow-x-scroll hide-scrollbar">
                {request.seasons.map((season) => (
                  <span key={`season-${season.id}`} className="mr-2">
                    <Badge>{season.seasonNumber}</Badge>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center mt-2 text-sm sm:mt-1">
          <span className="hidden mr-2 font-medium sm:block">
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
            />
          )}
        </div>
        {requestData.status === MediaRequestStatus.PENDING &&
          hasPermission(Permission.MANAGE_REQUESTS) && (
            <div className="flex items-end flex-1">
              <span className="mr-2">
                <Button
                  buttonType="success"
                  buttonSize="sm"
                  onClick={() => modifyRequest('approve')}
                >
                  <svg
                    className="w-4 h-4 mr-0 sm:mr-1"
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
                  <span className="hidden sm:block">
                    {intl.formatMessage(globalMessages.approve)}
                  </span>
                </Button>
              </span>
              <span>
                <Button
                  buttonType="danger"
                  buttonSize="sm"
                  onClick={() => modifyRequest('decline')}
                >
                  <svg
                    className="w-4 h-4 mr-0 sm:mr-1"
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
                  <span className="hidden sm:block">
                    {intl.formatMessage(globalMessages.decline)}
                  </span>
                </Button>
              </span>
            </div>
          )}
      </div>
      <Link
        href={
          request.type === 'movie'
            ? `/movie/${requestData.media.tmdbId}`
            : `/tv/${requestData.media.tmdbId}`
        }
      >
        <a className="flex-shrink-0 w-20 sm:w-28">
          <img
            src={
              title.posterPath
                ? `//image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`
                : '/images/overseerr_poster_not_found.png'
            }
            alt=""
            className="w-20 transition duration-300 scale-100 rounded-md shadow-sm cursor-pointer sm:w-28 transform-gpu hover:scale-105 hover:shadow-md"
          />
        </a>
      </Link>
    </div>
  );
};

export default withProperties(RequestCard, {
  Placeholder: RequestCardPlaceholder,
});
