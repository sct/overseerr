import { CheckIcon, TrashIcon, XIcon } from '@heroicons/react/solid';
import axios from 'axios';
import Link from 'next/link';
import React, { useContext, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { defineMessages, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import {
  MediaRequestStatus,
  MediaStatus,
} from '../../../server/constants/media';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { MovieDetails } from '../../../server/models/Movie';
import type { TvDetails } from '../../../server/models/Tv';
import { LanguageContext } from '../../context/LanguageContext';
import { Permission, useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import { withProperties } from '../../utils/typeHelpers';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import CachedImage from '../Common/CachedImage';
import StatusBadge from '../StatusBadge';

const messages = defineMessages({
  seasons: '{seasonCount, plural, one {Season} other {Seasons}}',
  mediaerror: 'The associated title for this request is no longer available.',
  deleterequest: 'Delete Request',
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

interface RequestCardErrorProps {
  mediaId?: number;
}

const RequestCardError: React.FC<RequestCardErrorProps> = ({ mediaId }) => {
  const { hasPermission } = useUser();
  const intl = useIntl();

  const deleteRequest = async () => {
    await axios.delete(`/api/v1/media/${mediaId}`);
    mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
  };

  return (
    <div className="relative p-4 bg-gray-800 ring-1 ring-red-500 rounded-xl w-72 sm:w-96">
      <div className="w-20 sm:w-28">
        <div className="w-full" style={{ paddingBottom: '150%' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full px-10">
            <div className="w-full text-xs text-center text-gray-300 whitespace-normal sm:text-sm">
              {intl.formatMessage(messages.mediaerror)}
            </div>
            {hasPermission(Permission.MANAGE_REQUESTS) && mediaId && (
              <div className="mt-4">
                <Button
                  buttonType="danger"
                  buttonSize="sm"
                  onClick={() => deleteRequest()}
                >
                  <TrashIcon className="w-5 h-5 mr-1" />
                  <span>{intl.formatMessage(messages.deleterequest)}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
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
    return <RequestCardError />;
  }

  if (!title || !requestData) {
    return <RequestCardError mediaId={requestData?.media.id} />;
  }

  return (
    <div className="relative flex p-4 overflow-hidden text-gray-400 bg-gray-800 bg-center bg-cover shadow rounded-xl w-72 sm:w-96 ring-1 ring-gray-700">
      {title.backdropPath && (
        <div className="absolute inset-0 z-0">
          <CachedImage
            alt=""
            src={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${title.backdropPath}`}
            layout="fill"
            objectFit="cover"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 75%)',
            }}
          />
        </div>
      )}
      <div className="relative z-10 flex flex-col flex-1 min-w-0 pr-4">
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
        {!isMovie(title) && request.seasons.length > 0 && (
          <div className="sm:flex items-center my-0.5 sm:my-1 text-sm hidden">
            <span className="mr-2 font-medium">
              {intl.formatMessage(messages.seasons, {
                seasonCount:
                  title.seasons.filter((season) => season.seasonNumber !== 0)
                    .length === request.seasons.length
                    ? 0
                    : request.seasons.length,
              })}
            </span>
            {title.seasons.filter((season) => season.seasonNumber !== 0)
              .length === request.seasons.length ? (
              <span className="mr-2 uppercase">
                <Badge>{intl.formatMessage(globalMessages.all)}</Badge>
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
            {intl.formatMessage(globalMessages.status)}
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
        {requestData.status === MediaRequestStatus.PENDING &&
          hasPermission(Permission.MANAGE_REQUESTS) && (
            <div className="flex items-end flex-1">
              <span className="mr-2">
                <Button
                  buttonType="success"
                  buttonSize="sm"
                  onClick={() => modifyRequest('approve')}
                >
                  <CheckIcon className="w-4 h-4 mr-0 sm:mr-1" />
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
                  <XIcon className="w-4 h-4 mr-0 sm:mr-1" />
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
        <a className="flex-shrink-0 w-20 overflow-hidden transition duration-300 scale-100 rounded-md shadow-sm cursor-pointer sm:w-28 transform-gpu hover:scale-105 hover:shadow-md">
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
          />
        </a>
      </Link>
    </div>
  );
};

export default withProperties(RequestCard, {
  Placeholder: RequestCardPlaceholder,
});
