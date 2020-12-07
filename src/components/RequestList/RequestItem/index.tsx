import React, { useContext } from 'react';
import type { MediaRequest } from '../../../../server/entity/MediaRequest';
import { useIntl, FormattedDate, FormattedRelativeTime } from 'react-intl';
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

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

interface RequestItemProps {
  request: MediaRequest;
}

const RequestItem: React.FC<RequestItemProps> = ({ request }) => {
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

  const modifyRequest = async (type: 'approve' | 'decline') => {
    const response = await axios.get(`/api/v1/request/${request.id}/${type}`);

    if (response) {
      // revalidate();
    }
  };

  if (!title && !error) {
    return (
      <tr className="w-full bg-gray-800 animate-pulse h-24">
        <td colSpan={6}></td>
      </tr>
    );
  }

  if (!title) {
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
        <img
          src={`//image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`}
          alt=""
          className="rounded-md shadow-sm cursor-pointer transition transform-gpu duration-300 scale-100 hover:scale-105 hover:shadow-md"
        />
      </Table.TD>
      <Table.TD>
        <h2 className="text-white text-xl mr-2">
          {isMovie(title) ? title.title : title.name}
        </h2>
        <div className="text-sm">
          Requested by {request.requestedBy.username}
        </div>
        {request.seasons.length > 0 && (
          <div className="hidden mt-2 text-sm sm:flex items-center">
            <span className="mr-2">Seasons</span>
            {request.seasons.map((season) => (
              <span key={`season-${season.id}`} className="mr-2">
                <Badge>{season.seasonNumber}</Badge>
              </span>
            ))}
          </div>
        )}
      </Table.TD>
      <Table.TD>
        <StatusBadge status={request.media.status} />
      </Table.TD>
      <Table.TD>
        <div className="flex flex-col">
          <span>Requested at</span>
          <span className="text-sm text-gray-300">
            <FormattedDate value={request.createdAt} />
          </span>
        </div>
      </Table.TD>
      <Table.TD>
        <div className="flex flex-col">
          <span>Modified by</span>
          {request.modifiedBy ? (
            <span className="text-sm text-gray-300">
              {request.modifiedBy.username} (
              <FormattedRelativeTime
                value={Math.floor(
                  (new Date(request.updatedAt).getTime() - Date.now()) / 1000
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
        {request.status === MediaRequestStatus.PENDING &&
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
      {/* <div className="flex justify-start flex-1 items-center">
        <div className="mr-12">
          <div className="flex flex-col">
            <span>Requested at</span>
            <span className="text-sm text-gray-300">
              <FormattedDate value={request.createdAt} />
            </span>
          </div>
        </div>
        <div>
          <div className="flex flex-col">
            <span>Modified by</span>
            {request.modifiedBy ? (
              <span className="text-sm text-gray-300">
                {request.modifiedBy.username} (
                <FormattedRelativeTime
                  value={Math.floor(
                    (new Date(request.updatedAt).getTime() - Date.now()) / 1000
                  )}
                  updateIntervalInSeconds={1}
                />
                )
              </span>
            ) : (
              <span className="text-sm text-gray-300">N/A</span>
            )}
          </div>
        </div>
      </div> */}
    </tr>
  );
};

export default RequestItem;
