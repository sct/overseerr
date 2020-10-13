import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { useUser } from '../../hooks/useUser';
import { Permission } from '../../../server/lib/permissions';
import { defineMessages, useIntl } from 'react-intl';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import useSWR from 'swr';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import {
  MediaStatus,
  MediaRequestStatus,
} from '../../../server/constants/media';
import { TvDetails, SeasonWithEpisodes } from '../../../server/models/Tv';
import type SeasonRequest from '../../../server/entity/SeasonRequest';
import Badge from '../Common/Badge';

const messages = defineMessages({
  requestadmin: 'Your request will be immediately approved.',
  cancelrequest:
    'This will remove your request. Are you sure you want to continue?',
});

interface RequestModalProps {
  request?: MediaRequest;
  tmdbId: number;
  visible?: boolean;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const TvRequestModal: React.FC<RequestModalProps> = ({
  visible,
  onCancel,
  onComplete,
  request,
  tmdbId,
  onUpdating,
}) => {
  const { addToast } = useToasts();
  const { data, error } = useSWR<TvDetails>(
    visible ? `/api/v1/tv/${tmdbId}` : null
  );
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>([]);
  const intl = useIntl();
  const { hasPermission } = useUser();

  const sendRequest = async () => {
    if (selectedSeasons.length === 0) {
      return;
    }
    if (onUpdating) {
      onUpdating(true);
    }
    const response = await axios.post<MediaRequest>('/api/v1/request', {
      mediaId: data?.id,
      tvdbId: data?.externalIds.tvdbId,
      mediaType: 'tv',
      seasons: selectedSeasons,
    });

    if (response.data) {
      if (onComplete) {
        onComplete(response.data.media.status);
      }
      addToast(
        <span>
          <strong>{data?.name}</strong> succesfully requested!
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
      if (onUpdating) {
        onUpdating(false);
      }
    }
  };

  const getAllRequestedSeasons = (): number[] =>
    (data?.mediaInfo?.requests ?? []).reduce((requestedSeasons, request) => {
      return [
        ...requestedSeasons,
        ...request.seasons.map((sr) => sr.seasonNumber),
      ];
    }, [] as number[]);

  const isSelectedSeason = (seasonNumber: number): boolean => {
    return selectedSeasons.includes(seasonNumber);
  };

  const toggleSeason = (seasonNumber: number): void => {
    // If this season already has a pending request, don't allow it to be toggled
    if (getAllRequestedSeasons().includes(seasonNumber)) {
      return;
    }

    if (selectedSeasons.includes(seasonNumber)) {
      setSelectedSeasons((seasons) =>
        seasons.filter((sn) => sn !== seasonNumber)
      );
    } else {
      setSelectedSeasons((seasons) => [...seasons, seasonNumber]);
    }
  };

  const toggleAllSeasons = (): void => {
    if (
      data &&
      selectedSeasons.length >= 0 &&
      selectedSeasons.length <
        data?.seasons
          .filter((season) => season.seasonNumber !== 0)
          .filter(
            (season) => !getAllRequestedSeasons().includes(season.seasonNumber)
          ).length
    ) {
      setSelectedSeasons(
        data.seasons
          .filter((season) => season.seasonNumber !== 0)
          .filter(
            (season) => !getAllRequestedSeasons().includes(season.seasonNumber)
          )
          .map((season) => season.seasonNumber)
      );
    } else {
      setSelectedSeasons([]);
    }
  };

  const isAllSeasons = (): boolean => {
    if (!data) {
      return false;
    }
    return (
      selectedSeasons.length ===
      data.seasons
        .filter((season) => season.seasonNumber !== 0)
        .filter(
          (season) => !getAllRequestedSeasons().includes(season.seasonNumber)
        ).length
    );
  };

  const text = hasPermission(Permission.MANAGE_REQUESTS)
    ? intl.formatMessage(messages.requestadmin)
    : undefined;

  const getSeasonRequest = (
    seasonNumber: number
  ): SeasonRequest | undefined => {
    let seasonRequest: SeasonRequest | undefined;
    if (data?.mediaInfo && (data.mediaInfo.requests || []).length > 0) {
      data.mediaInfo.requests.forEach((request) => {
        if (!seasonRequest) {
          seasonRequest = request.seasons.find(
            (season) => season.seasonNumber === seasonNumber
          );
        }
      });
    }

    return seasonRequest;
  };

  return (
    <Modal
      visible={visible}
      loading={!data && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={() => sendRequest()}
      title={`Request ${data?.name}`}
      okText={
        selectedSeasons.length === 0
          ? 'Select a season'
          : `Request ${selectedSeasons.length} seasons`
      }
      okDisabled={selectedSeasons.length === 0}
      okButtonType="primary"
      iconSvg={
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      }
    >
      <div className="flex flex-col">
        <div className="-mx-4 sm:mx-0 overflow-auto max-h-96">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-cool-gray-500 w-16">
                      <span
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isAllSeasons()}
                        onClick={() => toggleAllSeasons()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Space') {
                            toggleAllSeasons();
                          }
                        }}
                        className="group relative inline-flex items-center justify-center flex-shrink-0 h-5 w-10 cursor-pointer focus:outline-none"
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            isAllSeasons() ? 'bg-indigo-500' : 'bg-gray-800'
                          } absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200`}
                        ></span>
                        <span
                          aria-hidden="true"
                          className={`${
                            isAllSeasons() ? 'translate-x-5' : 'translate-x-0'
                          } absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform group-focus:shadow-outline group-focus:border-blue-300 transition-transform ease-in-out duration-200`}
                        ></span>
                      </span>
                    </th>
                    <th className="px-6 py-3 bg-cool-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      Season
                    </th>
                    <th className="px-6 py-3 bg-cool-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      # Of Episodes
                    </th>
                    <th className="px-6 py-3 bg-cool-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-cool-gray-600 divide-y">
                  {data?.seasons
                    .filter((season) => season.seasonNumber !== 0)
                    .map((season) => {
                      const seasonRequest = getSeasonRequest(
                        season.seasonNumber
                      );
                      return (
                        <tr key={`season-${season.id}`}>
                          <td className="px-4 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-100">
                            <span
                              role="checkbox"
                              tabIndex={0}
                              aria-checked={
                                !!seasonRequest ||
                                isSelectedSeason(season.seasonNumber)
                              }
                              onClick={() => toggleSeason(season.seasonNumber)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Space') {
                                  toggleSeason(season.seasonNumber);
                                }
                              }}
                              className={`group relative inline-flex items-center justify-center flex-shrink-0 h-5 w-10 cursor-pointer focus:outline-none ${
                                seasonRequest ? 'opacity-50' : ''
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`${
                                  !!seasonRequest ||
                                  isSelectedSeason(season.seasonNumber)
                                    ? 'bg-indigo-500'
                                    : 'bg-gray-800'
                                } absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200`}
                              ></span>
                              <span
                                aria-hidden="true"
                                className={`${
                                  !!seasonRequest ||
                                  isSelectedSeason(season.seasonNumber)
                                    ? 'translate-x-5'
                                    : 'translate-x-0'
                                } absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform group-focus:shadow-outline group-focus:border-blue-300 transition-transform ease-in-out duration-200`}
                              ></span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-100">
                            {season.seasonNumber === 0
                              ? 'Extras'
                              : `Season ${season.seasonNumber}`}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-200">
                            {season.episodeCount}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-200">
                            {!seasonRequest && <Badge>Not Requested</Badge>}
                            {seasonRequest?.status ===
                              MediaRequestStatus.PENDING && (
                              <Badge badgeType="warning">Pending</Badge>
                            )}
                            {seasonRequest?.status ===
                              MediaRequestStatus.APPROVED && (
                              <Badge badgeType="danger">Unavailable</Badge>
                            )}
                            {seasonRequest?.status ===
                              MediaRequestStatus.AVAILABLE && (
                              <Badge badgeType="success">Available</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4">{text}</p>
    </Modal>
  );
};

export default TvRequestModal;
