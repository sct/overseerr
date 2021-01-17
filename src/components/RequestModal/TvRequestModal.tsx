import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { useUser } from '../../hooks/useUser';
import { Permission } from '../../../server/lib/permissions';
import { defineMessages, useIntl } from 'react-intl';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import useSWR from 'swr';
import { useToasts } from 'react-toast-notifications';
import { ANIME_KEYWORD_ID } from '../../../server/api/themoviedb';
import axios from 'axios';
import {
  MediaStatus,
  MediaRequestStatus,
} from '../../../server/constants/media';
import { TvDetails } from '../../../server/models/Tv';
import Badge from '../Common/Badge';
import globalMessages from '../../i18n/globalMessages';
import SeasonRequest from '../../../server/entity/SeasonRequest';
import Alert from '../Common/Alert';
import AdvancedRequester, { RequestOverrides } from './AdvancedRequester';

const messages = defineMessages({
  requestadmin: 'Your request will be immediately approved.',
  cancelrequest:
    'This will remove your request. Are you sure you want to continue?',
  requestSuccess: '<strong>{title}</strong> successfully requested!',
  requestCancel: 'Request for <strong>{title}</strong> cancelled',
  requesttitle: 'Request {title}',
  request4ktitle: 'Request {title} in 4K',
  requesting: 'Requesting...',
  requestseasons:
    'Request {seasonCount} {seasonCount, plural, one {Season} other {Seasons}}',
  selectseason: 'Select season(s)',
  season: 'Season',
  numberofepisodes: '# of Episodes',
  status: 'Status',
  seasonnumber: 'Season {number}',
  extras: 'Extras',
  notrequested: 'Not Requested',
});

interface RequestModalProps extends React.HTMLAttributes<HTMLDivElement> {
  tmdbId: number;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
  is4k?: boolean;
}

const TvRequestModal: React.FC<RequestModalProps> = ({
  onCancel,
  onComplete,
  tmdbId,
  onUpdating,
  is4k = false,
}) => {
  const { addToast } = useToasts();
  const { data, error } = useSWR<TvDetails>(`/api/v1/tv/${tmdbId}`);
  const [
    requestOverrides,
    setRequestOverrides,
  ] = useState<RequestOverrides | null>(null);
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
    let overrideParams = {};
    if (requestOverrides) {
      overrideParams = {
        serverId: requestOverrides.server,
        profileId: requestOverrides.profile,
        rootFolder: requestOverrides.folder,
      };
    }
    const response = await axios.post<MediaRequest>('/api/v1/request', {
      mediaId: data?.id,
      tvdbId: data?.externalIds.tvdbId,
      mediaType: 'tv',
      is4k,
      seasons: selectedSeasons,
      ...overrideParams,
    });

    if (response.data) {
      if (onComplete) {
        onComplete(response.data.media.status);
      }
      addToast(
        <span>
          {intl.formatMessage(messages.requestSuccess, {
            title: data?.name,
            strong: function strong(msg) {
              return <strong>{msg}</strong>;
            },
          })}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
      if (onUpdating) {
        onUpdating(false);
      }
    }
  };

  const getAllRequestedSeasons = (): number[] => {
    const requestedSeasons = (data?.mediaInfo?.requests ?? [])
      .filter((request) => request.is4k === is4k)
      .reduce((requestedSeasons, request) => {
        return [
          ...requestedSeasons,
          ...request.seasons.map((sr) => sr.seasonNumber),
        ];
      }, [] as number[]);

    const availableSeasons = (data?.mediaInfo?.seasons ?? [])
      .filter(
        (season) =>
          (season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE ||
            season[is4k ? 'status4k' : 'status'] ===
              MediaStatus.PARTIALLY_AVAILABLE) &&
          !requestedSeasons.includes(season.seasonNumber)
      )
      .map((season) => season.seasonNumber);

    return [...requestedSeasons, ...availableSeasons];
  };

  const isSelectedSeason = (seasonNumber: number): boolean =>
    selectedSeasons.includes(seasonNumber);

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

  const getSeasonRequest = (
    seasonNumber: number
  ): SeasonRequest | undefined => {
    let seasonRequest: SeasonRequest | undefined;

    if (
      data?.mediaInfo &&
      (data.mediaInfo.requests || []).filter((request) => request.is4k === is4k)
        .length > 0
    ) {
      data.mediaInfo.requests
        .filter((request) => request.is4k === is4k)
        .forEach((request) => {
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
      loading={!data && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={() => sendRequest()}
      title={intl.formatMessage(
        is4k ? messages.request4ktitle : messages.requesttitle,
        { title: data?.name }
      )}
      okText={
        selectedSeasons.length === 0
          ? intl.formatMessage(messages.selectseason)
          : intl.formatMessage(messages.requestseasons, {
              seasonCount: selectedSeasons.length,
            })
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
      {(hasPermission(Permission.MANAGE_REQUESTS) ||
        hasPermission(Permission.AUTO_APPROVE) ||
        hasPermission(Permission.AUTO_APPROVE_MOVIE)) && (
        <p className="mt-6">
          <Alert title="Auto Approval" type="info">
            {intl.formatMessage(messages.requestadmin)}
          </Alert>
        </p>
      )}
      <div className="flex flex-col">
        <div className="-mx-4 sm:mx-0">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow sm:rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="w-16 px-4 py-3 bg-gray-500">
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
                        className="relative inline-flex items-center justify-center flex-shrink-0 w-10 h-5 cursor-pointer group focus:outline-none"
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
                          } absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform group-focus:ring group-focus:border-blue-300 transition-transform ease-in-out duration-200`}
                        ></span>
                      </span>
                    </th>
                    <th className="px-1 py-3 text-xs font-medium leading-4 tracking-wider text-left text-gray-200 uppercase bg-gray-500 md:px-6">
                      {intl.formatMessage(messages.season)}
                    </th>
                    <th className="px-5 py-3 text-xs font-medium leading-4 tracking-wider text-left text-gray-200 uppercase bg-gray-500 md:px-6">
                      {intl.formatMessage(messages.numberofepisodes)}
                    </th>
                    <th className="px-2 py-3 text-xs font-medium leading-4 tracking-wider text-left text-gray-200 uppercase bg-gray-500 md:px-6">
                      {intl.formatMessage(messages.status)}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-600 divide-y divide-gray-700">
                  {data?.seasons
                    .filter((season) => season.seasonNumber !== 0)
                    .map((season) => {
                      const seasonRequest = getSeasonRequest(
                        season.seasonNumber
                      );
                      const mediaSeason = data?.mediaInfo?.seasons.find(
                        (sn) =>
                          sn.seasonNumber === season.seasonNumber &&
                          sn[is4k ? 'status4k' : 'status'] !==
                            MediaStatus.UNKNOWN
                      );
                      return (
                        <tr key={`season-${season.id}`}>
                          <td className="px-4 py-4 text-sm font-medium leading-5 text-gray-100 whitespace-nowrap">
                            <span
                              role="checkbox"
                              tabIndex={0}
                              aria-checked={
                                !!mediaSeason ||
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
                                mediaSeason || seasonRequest ? 'opacity-50' : ''
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`${
                                  !!mediaSeason ||
                                  !!seasonRequest ||
                                  isSelectedSeason(season.seasonNumber)
                                    ? 'bg-indigo-500'
                                    : 'bg-gray-800'
                                } absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200`}
                              ></span>
                              <span
                                aria-hidden="true"
                                className={`${
                                  !!mediaSeason ||
                                  !!seasonRequest ||
                                  isSelectedSeason(season.seasonNumber)
                                    ? 'translate-x-5'
                                    : 'translate-x-0'
                                } absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform group-focus:ring group-focus:border-blue-300 transition-transform ease-in-out duration-200`}
                              ></span>
                            </span>
                          </td>
                          <td className="px-1 py-4 text-sm font-medium leading-5 text-gray-100 md:px-6 whitespace-nowrap">
                            {season.seasonNumber === 0
                              ? intl.formatMessage(messages.extras)
                              : intl.formatMessage(messages.seasonnumber, {
                                  number: season.seasonNumber,
                                })}
                          </td>
                          <td className="px-5 py-4 text-sm leading-5 text-gray-200 md:px-6 whitespace-nowrap">
                            {season.episodeCount}
                          </td>
                          <td className="py-4 pr-2 text-sm leading-5 text-gray-200 md:px-6 whitespace-nowrap">
                            {!seasonRequest && !mediaSeason && (
                              <Badge>
                                {intl.formatMessage(messages.notrequested)}
                              </Badge>
                            )}
                            {!mediaSeason &&
                              seasonRequest?.status ===
                                MediaRequestStatus.PENDING && (
                                <Badge badgeType="warning">
                                  {intl.formatMessage(globalMessages.pending)}
                                </Badge>
                              )}
                            {!mediaSeason &&
                              seasonRequest?.status ===
                                MediaRequestStatus.APPROVED && (
                                <Badge badgeType="primary">
                                  {intl.formatMessage(globalMessages.requested)}
                                </Badge>
                              )}
                            {!mediaSeason &&
                              seasonRequest?.status ===
                                MediaRequestStatus.AVAILABLE && (
                                <Badge badgeType="success">
                                  {intl.formatMessage(globalMessages.available)}
                                </Badge>
                              )}
                            {mediaSeason?.[is4k ? 'status4k' : 'status'] ===
                              MediaStatus.PARTIALLY_AVAILABLE && (
                              <Badge badgeType="success">
                                {intl.formatMessage(
                                  globalMessages.partiallyavailable
                                )}
                              </Badge>
                            )}
                            {mediaSeason?.[is4k ? 'status4k' : 'status'] ===
                              MediaStatus.AVAILABLE && (
                              <Badge badgeType="success">
                                {intl.formatMessage(globalMessages.available)}
                              </Badge>
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
      {hasPermission(Permission.REQUEST_ADVANCED) && (
        <div className="mt-4">
          <AdvancedRequester
            type="tv"
            is4k={is4k}
            isAnime={data?.keywords.some(
              (keyword) => keyword.id === ANIME_KEYWORD_ID
            )}
            onChange={(overrides) => setRequestOverrides(overrides)}
          />
        </div>
      )}
    </Modal>
  );
};

export default TvRequestModal;
