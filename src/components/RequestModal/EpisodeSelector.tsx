import Badge from '@app/components/Common/Badge';
import globalMessages from '@app/i18n/globalMessages';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { MediaRequestStatus } from '@server/constants/media';
import type EpisodeRequest from '@server/entity/EpisodeRequest';
import type { MediaRequest } from '@server/entity/MediaRequest';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  episodeName: {
    id: 'episode.name',
    defaultMessage: 'Episode {number}: {name}',
  },
  selected: {
    id: 'episode.selected',
    defaultMessage: 'Selected',
  },
  showSummary: {
    id: 'episode.showSummary',
    defaultMessage: 'Click to show episode summary',
  },
  hideSummary: {
    id: 'episode.hideSummary',
    defaultMessage: 'Click to hide episode summary',
  },
});

export interface Episode {
  id: number;
  name: string;
  airDate: string | null;
  episodeNumber: number;
  overview: string;
  seasonNumber: number;
  showId: number;
  stillPath?: string;
  voteAverage: number;
  voteCount: number;
}

export interface SeasonWithEpisodes {
  airDate: string;
  episodes: Episode[];
  externalIds: {
    freebaseId?: string;
    freebaseMid?: string;
    imdbId?: string;
    tvdbId?: number;
    tvrageId?: number;
  };
  id: number;
  name: string;
  overview: string;
  seasonNumber: number;
  posterPath?: string;
}

interface EpisodeSelectorProps {
  tvId: number;
  seasonNumber: number;
  selectedEpisodes: number[];
  episodeRequests: EpisodeRequest[];
  onEpisodeToggle: (episodeNumber: number) => void;
  disabled?: boolean;
  isSeasonSelected?: boolean; // Currently selected in UI for new requests
  isSeasonAlreadyRequested?: boolean; // Already requested from existing requests
  seasonRequestStatus?: MediaRequestStatus; // Added to track parent season's request status
  canManageRequests?: boolean; // Whether user can manage requests (admin)
  onSeasonDeselect?: (episodeToDeselect: number) => void; // Callback to deselect season when admin toggles episodes
  editRequest?: MediaRequest; // Current request being edited (to distinguish from other requests)
  allRequests?: MediaRequest[]; // All requests for this media to find parent request data
}

const EpisodeSelector = ({
  tvId,
  seasonNumber,
  selectedEpisodes,
  episodeRequests,
  onEpisodeToggle,
  disabled = false,
  isSeasonSelected = false,
  isSeasonAlreadyRequested = false,
  seasonRequestStatus,
  canManageRequests = false,
  onSeasonDeselect,
  editRequest,
  allRequests = [],
}: EpisodeSelectorProps) => {
  const intl = useIntl();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(
    new Set()
  );

  const toggleSummary = (episodeNumber: number) => {
    setExpandedSummaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(episodeNumber)) {
        newSet.delete(episodeNumber);
      } else {
        newSet.add(episodeNumber);
      }
      return newSet;
    });
  };

  const { data: seasonData, error } = useSWR<SeasonWithEpisodes>(
    isExpanded ? `/api/v1/tv/${tvId}/season/${seasonNumber}` : null
  );

  const getEpisodeRequest = (
    episodeNumber: number
  ): EpisodeRequest | undefined => {
    return episodeRequests.find(
      (req) =>
        req.seasonNumber === seasonNumber && req.episodeNumber === episodeNumber
    );
  };

  const isEpisodeSelected = (episodeNumber: number): boolean => {
    // If season is selected OR already requested, show all episodes as selected (cosmetic)
    if (isSeasonSelected || isSeasonAlreadyRequested) {
      return true;
    }

    // Check if episode has an existing request (approved, pending, etc.)
    const episodeRequest = getEpisodeRequest(episodeNumber);

    if (episodeRequest) {
      const isFromCurrentRequest = editRequest?.episodes?.some(
        (ep: EpisodeRequest) =>
          ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
      );

      if (isFromCurrentRequest) {
        // Use selectedEpisodes state for current request episodes
        return selectedEpisodes.includes(episodeNumber);
      } else {
        return true;
      }
    }

    return selectedEpisodes.includes(episodeNumber);
  };

  const getEpisodeStatus = (episodeNumber: number) => {
    const episodeRequest = getEpisodeRequest(episodeNumber);

    if (episodeRequest && editRequest) {
      const isFromCurrentRequest = editRequest.episodes?.some(
        (ep: EpisodeRequest) =>
          ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
      );

      if (isFromCurrentRequest) {
        if (!isEpisodeSelected(episodeNumber)) {
          return 'not-requested';
        }
        return 'pending';
      }
    }

    if (!episodeRequest) {
      // If no individual episode request exists, check if parent season is requested
      if (seasonRequestStatus !== undefined) {
        switch (seasonRequestStatus) {
          case MediaRequestStatus.PENDING:
            return 'pending';
          case MediaRequestStatus.APPROVED:
            return 'approved';
          case MediaRequestStatus.COMPLETED:
            return 'available';
          case MediaRequestStatus.FAILED:
            return 'failed';
          case MediaRequestStatus.DECLINED:
            return 'declined';
        }
      }

      return isEpisodeSelected(episodeNumber) ? 'pending' : 'not-requested';
    }

    // For episodes from other requests, use database status
    // Find the parent request by looking through episode requests
    const parentRequestData = allRequests?.find((request) =>
      request.episodes?.some(
        (ep: EpisodeRequest) =>
          ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
      )
    );

    // If parent request is approved/completed but episode is still pending,
    // show the parent status (indicates request was approved)
    if (
      episodeRequest.status === MediaRequestStatus.PENDING &&
      (parentRequestData?.status === MediaRequestStatus.APPROVED ||
        parentRequestData?.status === MediaRequestStatus.COMPLETED)
    ) {
      return 'approved';
    }

    switch (episodeRequest.status) {
      case MediaRequestStatus.PENDING:
        return 'pending';
      case MediaRequestStatus.APPROVED:
        return 'approved';
      case MediaRequestStatus.COMPLETED:
        return 'available';
      case MediaRequestStatus.FAILED:
        return 'failed';
      case MediaRequestStatus.DECLINED:
        return 'declined';
      default:
        return 'not-requested';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge badgeType="warning">
            {intl.formatMessage(globalMessages.pending)}
          </Badge>
        );
      case 'approved':
        return (
          <Badge badgeType="primary">
            {intl.formatMessage(globalMessages.requested)}
          </Badge>
        );
      case 'processing':
        return (
          <Badge badgeType="success">
            {intl.formatMessage(globalMessages.processing)}
          </Badge>
        );
      case 'available':
        return (
          <Badge badgeType="success">
            {intl.formatMessage(globalMessages.available)}
          </Badge>
        );
      case 'partially-available':
        return (
          <Badge badgeType="success">
            {intl.formatMessage(globalMessages.partiallyavailable)}
          </Badge>
        );
      case 'failed':
        return (
          <Badge badgeType="danger">
            {intl.formatMessage(globalMessages.failed)}
          </Badge>
        );
      case 'declined':
        return (
          <Badge badgeType="danger">
            {intl.formatMessage(globalMessages.declined)}
          </Badge>
        );
      case 'selected':
        return (
          <Badge badgeType="primary">
            {intl.formatMessage(messages.selected)}
          </Badge>
        );
      case 'requested':
        return (
          <Badge badgeType="primary">
            {intl.formatMessage(globalMessages.requested)}
          </Badge>
        );
      default:
        return <Badge>{intl.formatMessage(globalMessages.notrequested)}</Badge>;
    }
  };

  React.useEffect(() => {
    setIsExpanded(true);
  }, []);

  return (
    <div
      className="border-t border-gray-700 bg-gray-900 bg-opacity-50"
      data-testid="episode-accordion"
    >
      {error && (
        <div className="px-4 py-3 text-sm text-red-400">
          Failed to load episode data
        </div>
      )}

      {!seasonData && !error && (
        <div className="px-4 py-3 text-sm text-gray-400">
          Loading episodes...
        </div>
      )}

      {seasonData && (
        <div className="divide-y divide-gray-700">
          {/* Episode List Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-800 bg-opacity-50 px-4 py-2 text-xs font-medium uppercase text-gray-400">
            <div className="col-span-1">Toggle</div>
            <div className="col-span-5">Episode</div>
            <div className="col-span-1">Info</div>
            <div className="col-span-3">Air Date</div>
            <div className="col-span-2">
              <span>Status</span>
            </div>
          </div>

          {/* Episodes */}
          {seasonData.episodes.map((episode) => {
            const status = getEpisodeStatus(episode.episodeNumber);
            const isRequested = getEpisodeRequest(episode.episodeNumber);
            const isFromCurrentRequest = editRequest?.episodes?.some(
              (ep: EpisodeRequest) =>
                ep.seasonNumber === seasonNumber &&
                ep.episodeNumber === episode.episodeNumber
            );

            // Episodes from other requests should be non-editable regardless of status
            // Episodes from current request should be editable if pending
            const isEpisodeNonEditable =
              isRequested &&
              (!isFromCurrentRequest || // Episode is from another request
                isRequested.status === MediaRequestStatus.APPROVED ||
                isRequested.status === MediaRequestStatus.COMPLETED ||
                isRequested.status === MediaRequestStatus.FAILED);

            const canToggle =
              !disabled &&
              !isEpisodeNonEditable && // Disable if episode is from other request or non-pending
              (!isSeasonSelected || canManageRequests) && // Allow admins to toggle episodes even when season is selected
              !isSeasonAlreadyRequested; // Disable if season is selected or already requested

            const isSummaryExpanded = expandedSummaries.has(
              episode.episodeNumber
            );

            return (
              <div key={`episode-${episode.id}`}>
                <div
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-800 hover:bg-opacity-50"
                  data-testid="episode-row"
                >
                  {/* Toggle */}
                  <div className="col-span-1">
                    <span
                      role="checkbox"
                      tabIndex={canToggle ? 0 : -1}
                      data-testid="episode-toggle"
                      aria-checked={isEpisodeSelected(episode.episodeNumber)}
                      onClick={() => {
                        if (canToggle) {
                          // If toggling episodes in a selected season, convert to individual episodes excluding the clicked one
                          if (isSeasonSelected && onSeasonDeselect) {
                            onSeasonDeselect(episode.episodeNumber);
                          } else {
                            // Normal episode toggle when season is not selected
                            onEpisodeToggle(episode.episodeNumber);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          canToggle &&
                          (e.key === 'Enter' || e.key === 'Space')
                        ) {
                          // If toggling episodes in a selected season, convert to individual episodes excluding the clicked one
                          if (isSeasonSelected && onSeasonDeselect) {
                            onSeasonDeselect(episode.episodeNumber);
                          } else {
                            // Normal episode toggle when season is not selected
                            onEpisodeToggle(episode.episodeNumber);
                          }
                        }
                      }}
                      className={`relative inline-flex h-4 w-8 flex-shrink-0 items-center justify-center focus:outline-none ${
                        canToggle
                          ? 'cursor-pointer'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          isEpisodeSelected(episode.episodeNumber)
                            ? 'bg-indigo-500'
                            : 'bg-gray-600'
                        } absolute mx-auto h-3 w-7 rounded-full transition-colors duration-200 ease-in-out`}
                      />
                      <span
                        aria-hidden="true"
                        className={`${
                          isEpisodeSelected(episode.episodeNumber)
                            ? 'translate-x-3'
                            : 'translate-x-0'
                        } absolute left-0 inline-block h-4 w-4 rounded-full border border-gray-200 bg-white shadow transition-transform duration-200 ease-in-out`}
                      />
                    </span>
                  </div>

                  {/* Episode Info */}
                  <div className="col-span-5">
                    <div className="text-sm font-medium text-gray-100">
                      {intl.formatMessage(messages.episodeName, {
                        number: episode.episodeNumber,
                        name: episode.name,
                      })}
                    </div>
                  </div>

                  {/* Info Icon */}
                  <div className="col-span-1 flex justify-center">
                    {episode.overview && (
                      <button
                        onClick={() => toggleSummary(episode.episodeNumber)}
                        className="text-gray-400 transition-colors hover:text-gray-300 focus:outline-none"
                      >
                        <InformationCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Air Date */}
                  <div
                    className="col-span-3 text-sm text-gray-300"
                    data-testid="episode-air-date"
                  >
                    {episode.airDate
                      ? new Date(episode.airDate).toLocaleDateString()
                      : 'TBA'}
                  </div>

                  {/* Status */}
                  <div className="col-span-2" data-testid="episode-status">
                    {getStatusBadge(status)}
                  </div>
                </div>

                {/* Expandable Summary */}
                {isSummaryExpanded && episode.overview && (
                  <div className="px-4 pb-3">
                    <div className="ml-8 mr-4 rounded border-l-4 border-indigo-500 bg-gray-800 p-3">
                      <h4 className="mb-2 text-sm font-medium text-gray-200">
                        Episode Summary
                      </h4>
                      <p className="text-sm leading-relaxed text-gray-300">
                        {episode.overview}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EpisodeSelector;
