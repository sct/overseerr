import React, { useContext, useState } from 'react';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { TvDetails } from '../../../server/models/Tv';
import type { MovieDetails } from '../../../server/models/Movie';
import useSWR from 'swr';
import { LanguageContext } from '../../context/LanguageContext';
import {
  MediaStatus,
  MediaRequestStatus,
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
  requestedby: 'Requested by {username}',
  seasons: 'Seasons',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const RequestCardPlaceholder: React.FC = () => {
  return (
    <div className="w-72 sm:w-96 relative animate-pulse rounded-lg bg-gray-700 p-4">
      <div className="w-20 sm:w-28">
        <div className="w-full" style={{ paddingBottom: '150%' }} />
      </div>
    </div>
  );
};

interface RequestCardProps {
  request: MediaRequest;
}

const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const { locale } = useContext(LanguageContext);
  const url =
    request.type === 'movie'
      ? `/api/v1/movie/${request.media.tmdbId}`
      : `/api/v1/tv/${request.media.tmdbId}`;
  const { data: title, error } = useSWR<MovieDetails | TvDetails>(
    `${url}?language=${locale}`
  );
  const { data: requestData, error: requestError, revalidate } = useSWR<
    MediaRequest
  >(`/api/v1/request/${request.id}`, {
    initialData: request,
  });

  const modifyRequest = async (type: 'approve' | 'decline') => {
    const response = await axios.get(`/api/v1/request/${request.id}/${type}`);

    if (response) {
      revalidate();
    }
  };

  if (!title && !error) {
    return <RequestCardPlaceholder />;
  }

  if (!requestData && !requestError) {
    return <RequestCardPlaceholder />;
  }

  if (!title || !requestData) {
    return <RequestCardPlaceholder />;
  }

  return (
    <div
      className="relative w-72 sm:w-96 p-4 bg-gray-800 rounded-md flex bg-cover bg-center text-gray-400"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%), url(//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${title.backdropPath})`,
      }}
    >
      <div className="flex-1 pr-4 min-w-0 flex flex-col">
        <h2 className="text-base sm:text-lg overflow-ellipsis overflow-hidden whitespace-nowrap text-white cursor-pointer hover:underline">
          <Link
            href={request.type === 'movie' ? '/movie/[movieId]' : '/tv/[tvId]'}
            as={
              request.type === 'movie'
                ? `/movie/${request.media.tmdbId}`
                : `/tv/${request.media.tmdbId}`
            }
          >
            {isMovie(title) ? title.title : title.name}
          </Link>
        </h2>
        <div className="text-xs sm:text-sm">
          {intl.formatMessage(messages.requestedby, {
            username: requestData.requestedBy.username,
          })}
        </div>
        {requestData.media.status && (
          <div className="mt-1 sm:mt-2">
            <StatusBadge status={requestData.media.status} />
          </div>
        )}
        {request.seasons.length > 0 && (
          <div className="hidden mt-2 text-sm sm:flex items-center">
            <span className="mr-2">{intl.formatMessage(messages.seasons)}</span>
            {request.seasons.map((season) => (
              <span key={`season-${season.id}`} className="mr-2">
                <Badge>{season.seasonNumber}</Badge>
              </span>
            ))}
          </div>
        )}
        {requestData.status === MediaRequestStatus.PENDING &&
          hasPermission(Permission.MANAGE_REQUESTS) && (
            <div className="flex-1 flex items-end">
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
      <div className="flex-shrink-0 w-20 sm:w-28">
        <Link
          href={request.type === 'movie' ? '/movie/[movieId]' : '/tv/[tvId]'}
          as={
            request.type === 'movie'
              ? `/movie/${request.media.tmdbId}`
              : `/tv/${request.media.tmdbId}`
          }
        >
          <img
            src={`//image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`}
            alt=""
            className="w-20 sm:w-28 rounded-md shadow-sm cursor-pointer transition transform-gpu duration-300 scale-100 hover:scale-105 hover:shadow-md"
          />
        </Link>
      </div>
    </div>
  );
};

export default withProperties(RequestCard, {
  Placeholder: RequestCardPlaceholder,
});
