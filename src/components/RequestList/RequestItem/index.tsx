import React, { useContext } from 'react';
import { useInView } from 'react-intersection-observer';
import type { MediaRequest } from '../../../../server/entity/MediaRequest';
import {
  useIntl,
  FormattedDate,
  FormattedRelativeTime,
  defineMessages,
} from 'react-intl';
import { useUser, Permission } from '../../../hooks/useUser';
import { LanguageContext } from '../../../context/LanguageContext';
import type { MovieDetails } from '../../../../server/models/Movie';
import type { TvDetails } from '../../../../server/models/Tv';
import useSWR from 'swr';
import Badge from '../../Common/Badge';
import StatusBadge from '../../StatusBadge';
import Table from '../../Common/Table';
import { MediaRequestStatus } from '../../../../server/constants/media';
import Button from '../../Common/Button';
import axios from 'axios';
import globalMessages from '../../../i18n/globalMessages';
import Link from 'next/link';

const messages = defineMessages({
  requestedby: 'Requested by {username}',
  seasons: 'Seasons',
  notavailable: 'N/A',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

interface RequestItemProps {
  request: MediaRequest;
  onDelete: () => void;
}

const RequestItem: React.FC<RequestItemProps> = ({ request, onDelete }) => {
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
  const { data: requestData, revalidate } = useSWR<MediaRequest>(
    `/api/v1/request/${request.id}`,
    {
      initialData: request,
    }
  );

  const modifyRequest = async (type: 'approve' | 'decline') => {
    const response = await axios.get(`/api/v1/request/${request.id}/${type}`);

    if (response) {
      revalidate();
    }
  };

  const deleteRequest = async () => {
    await axios.delete(`/api/v1/request/${request.id}`);

    onDelete();
  };

  if (!title && !error) {
    return (
      <tr className="w-full bg-gray-800 animate-pulse h-24" ref={ref}>
        <td colSpan={6}></td>
      </tr>
    );
  }

  if (!title || !requestData) {
    return (
      <tr className="w-full bg-gray-800 animate-pulse h-24">
        <td colSpan={6}></td>
      </tr>
    );
  }

  return (
    <tr className="w-full bg-gray-800 h-24 p-2 relative text-white">
      <Table.TD
        noPadding
        className="w-20 px-4 relative hidden sm:table-cell align-middle"
      >
        <Link
          href={
            request.type === 'movie'
              ? `/movie/${request.media.tmdbId}`
              : `/tv/${request.media.tmdbId}`
          }
        >
          <a>
            <img
              src={`//image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`}
              alt=""
              className="rounded-md shadow-sm cursor-pointer transition transform-gpu duration-300 scale-100 hover:scale-105 hover:shadow-md"
            />
          </a>
        </Link>
      </Table.TD>
      <Table.TD>
        <Link
          href={
            requestData.type === 'movie'
              ? `/movie/${requestData.media.tmdbId}`
              : `/tv/${requestData.media.tmdbId}`
          }
        >
          <a className="text-white text-xl mr-2 hover:underline">
            {isMovie(title) ? title.title : title.name}
          </a>
        </Link>
        <div className="text-sm">
          {intl.formatMessage(messages.requestedby, {
            username: requestData.requestedBy.username,
          })}
        </div>
        {requestData.seasons.length > 0 && (
          <div className="hidden mt-2 text-sm sm:flex items-center">
            <span className="mr-2">{intl.formatMessage(messages.seasons)}</span>
            {requestData.seasons.map((season) => (
              <span key={`season-${season.id}`} className="mr-2">
                <Badge>{season.seasonNumber}</Badge>
              </span>
            ))}
          </div>
        )}
      </Table.TD>
      <Table.TD>
        <StatusBadge status={requestData.media.status} />
      </Table.TD>
      <Table.TD>
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">
            <FormattedDate value={requestData.createdAt} />
          </span>
        </div>
      </Table.TD>
      <Table.TD>
        <div className="flex flex-col">
          {requestData.modifiedBy ? (
            <span className="text-sm text-gray-300">
              {requestData.modifiedBy.username} (
              <FormattedRelativeTime
                value={Math.floor(
                  (new Date(requestData.updatedAt).getTime() - Date.now()) /
                    1000
                )}
                updateIntervalInSeconds={1}
              />
              )
            </span>
          ) : (
            <span className="text-sm text-gray-300">N/A</span>
          )}
        </div>
      </Table.TD>
      <Table.TD alignText="right">
        {requestData.status !== MediaRequestStatus.PENDING &&
          hasPermission(Permission.MANAGE_REQUESTS) && (
            <Button
              buttonType="danger"
              buttonSize="sm"
              onClick={() => deleteRequest()}
            >
              <svg
                className="w-4 h-4 mr-0 sm:mr-1"
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
              <span className="hidden sm:block">
                {intl.formatMessage(globalMessages.delete)}
              </span>
            </Button>
          )}
        {requestData.status === MediaRequestStatus.PENDING &&
          hasPermission(Permission.MANAGE_REQUESTS) && (
            <>
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
            </>
          )}
      </Table.TD>
    </tr>
  );
};

export default RequestItem;
