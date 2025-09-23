import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Modal from '@app/components/Common/Modal';
import type { RequestOverrides } from '@app/components/RequestModal/AdvancedRequester';
import AdvancedRequester from '@app/components/RequestModal/AdvancedRequester';
import EpisodeSelector, {
  type SeasonWithEpisodes,
} from '@app/components/RequestModal/EpisodeSelector';
import QuotaDisplay from '@app/components/RequestModal/QuotaDisplay';
import SearchByNameModal from '@app/components/RequestModal/SearchByNameModal';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import { ANIME_KEYWORD_ID } from '@server/api/themoviedb/constants';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type EpisodeRequest from '@server/entity/EpisodeRequest';
import type Media from '@server/entity/Media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import { Permission } from '@server/lib/permissions';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

const messages = defineMessages({
  requestadmin: 'This request will be approved automatically.',
  requestSuccess: '<strong>{title}</strong> requested successfully!',
  requestSuccessEpisodes:
    '<strong>{title}</strong> ({episodeCount} {episodeCount, plural, one {episode} other {episodes}}) requested successfully!',
  requestSuccessSeasonAndEpisodes:
    '<strong>{title}</strong> ({seasonCount} {seasonCount, plural, one {season} other {seasons}} and {episodeCount} {episodeCount, plural, one {episode} other {episodes}}) requested successfully!',
  requestseriestitle: 'Request Series',
  requestseries4ktitle: 'Request Series in 4K',
  edit: 'Edit Request',
  approve: 'Approve Request',
  cancel: 'Cancel Request',
  pendingrequest: 'Pending Request',
  pending4krequest: 'Pending 4K Request',
  requestfrom: "{username}'s request is pending approval.",
  requestseasons:
    'Request {seasonCount} {seasonCount, plural, one {Season} other {Seasons}}',
  requestseasons4k:
    'Request {seasonCount} {seasonCount, plural, one {Season} other {Seasons}} in 4K',
  alreadyrequested: 'Already Requested',
  selectseason: 'Select Season(s)',
  requestepisodes:
    'Request {episodeCount} {episodeCount, plural, one {Episode} other {Episodes}}',
  requestseasonsandepisodes:
    'Request {seasonCount} {seasonCount, plural, one {Season} other {Seasons}} and {episodeCount} {episodeCount, plural, one {Episode} other {Episodes}}',
  season: 'Season',
  numberofepisodes: '# of Episodes',
  seasonnumber: 'Season {number}',
  errorediting: 'Something went wrong while editing the request.',
  requestedited: 'Request for <strong>{title}</strong> edited successfully!',
  requestApproved: 'Request for <strong>{title}</strong> approved!',
  requestcancelled: 'Request for <strong>{title}</strong> canceled.',
  autoapproval: 'Automatic Approval',
  requesterror: 'Something went wrong while submitting the request.',
  pendingapproval: 'Your request is pending approval.',
});

interface RequestModalProps extends React.HTMLAttributes<HTMLDivElement> {
  tmdbId: number;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
  is4k?: boolean;
  editRequest?: MediaRequest;
  media?: Media;
}

const TvRequestModal = ({
  onCancel,
  onComplete,
  tmdbId,
  onUpdating,
  editRequest,
  media,
  is4k = false,
}: RequestModalProps) => {
  const settings = useSettings();
  const { addToast } = useToasts();
  const editingSeasons: number[] = (editRequest?.seasons ?? []).map(
    (season) => season.seasonNumber
  );
  const { data, error } = useSWR<TvDetails>(`/api/v1/tv/${tmdbId}`);
  const [requestOverrides, setRequestOverrides] =
    useState<RequestOverrides | null>(null);
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>(
    editRequest ? editingSeasons : []
  );

  const [selectedEpisodes, setSelectedEpisodes] = useState<
    Record<number, number[]>
  >(() => {
    if (!editRequest?.episodes) return {};

    const episodesByseason: Record<number, number[]> = {};
    editRequest.episodes.forEach((episode) => {
      if (!episodesByseason[episode.seasonNumber]) {
        episodesByseason[episode.seasonNumber] = [];
      }
      episodesByseason[episode.seasonNumber].push(episode.episodeNumber);
    });

    return episodesByseason;
  });

  const [episodeModeSeasons, setEpisodeModeSeasons] = useState<Set<number>>(
    () => {
      if (!editRequest?.episodes) return new Set();

      const seasonsWithEpisodes = new Set<number>();
      editRequest.episodes.forEach((episode) => {
        seasonsWithEpisodes.add(episode.seasonNumber);
      });

      return seasonsWithEpisodes;
    }
  );
  const intl = useIntl();
  const { user, hasPermission } = useUser();

  const existingRequestState = React.useMemo(() => {
    const requestsSource = data?.mediaInfo?.requests || media?.requests || [];

    if (requestsSource.length === 0)
      return {
        seasons: new Set<number>(),
        episodes: new Map<number, Set<number>>(),
      };

    const existingSeasons = new Set<number>();
    const existingEpisodes = new Map<number, Set<number>>();

    // Process all non-declined requests for this media
    requestsSource
      .filter(
        (request) =>
          request.is4k === is4k &&
          request.status !== MediaRequestStatus.DECLINED
      )
      .forEach((request) => {
        // Add full seasons
        request.seasons?.forEach((season) => {
          existingSeasons.add(season.seasonNumber);
        });

        // Add individual episodes
        request.episodes?.forEach((episode) => {
          if (!existingEpisodes.has(episode.seasonNumber)) {
            existingEpisodes.set(episode.seasonNumber, new Set());
          }
          existingEpisodes
            .get(episode.seasonNumber)
            ?.add(episode.episodeNumber);
        });
      });

    return { seasons: existingSeasons, episodes: existingEpisodes };
  }, [data?.mediaInfo?.requests, media?.requests, is4k]);
  const [searchModal, setSearchModal] = useState<{
    show: boolean;
  }>({
    show: true,
  });
  const [tvdbId, setTvdbId] = useState<number | undefined>(undefined);
  const { data: quota } = useSWR<QuotaResponse>(
    user &&
      (!requestOverrides?.user?.id || hasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${requestOverrides?.user?.id ?? user.id}/quota`
      : null
  );

  const currentlyRemaining =
    (quota?.tv.remaining ?? 0) -
    selectedSeasons.length +
    (editRequest?.seasons ?? []).length;

  const updateRequest = async (alsoApproveRequest = false) => {
    if (!editRequest) {
      return;
    }

    if (onUpdating) {
      onUpdating(true);
      mutate('/api/v1/request/count');
    }

    try {
      // Build the request payload that combines full seasons and individual episodes
      const hasAnyContent =
        selectedSeasons.length > 0 || hasAnySelectedEpisodes();

      if (hasAnyContent) {
        // Check if we're just approving without making changes
        const originalSelectedSeasons = new Set(
          (editRequest.seasons ?? []).map((s) => s.seasonNumber)
        );
        const originalSelectedEpisodes: Record<number, number[]> = {};
        (editRequest.episodes ?? []).forEach((ep) => {
          if (!originalSelectedEpisodes[ep.seasonNumber]) {
            originalSelectedEpisodes[ep.seasonNumber] = [];
          }
          originalSelectedEpisodes[ep.seasonNumber].push(ep.episodeNumber);
        });

        const currentSelectedSeasons = new Set(selectedSeasons);
        const hasSeasonChanges =
          originalSelectedSeasons.size !== currentSelectedSeasons.size ||
          Array.from(originalSelectedSeasons).some(
            (s) => !currentSelectedSeasons.has(s)
          ) ||
          Array.from(currentSelectedSeasons).some(
            (s) => !originalSelectedSeasons.has(s)
          );

        const hasEpisodeChanges = Object.keys(selectedEpisodes).some(
          (seasonNum) => {
            const seasonNumber = Number(seasonNum);
            const currentEpisodes = selectedEpisodes[seasonNumber] || [];
            const originalEpisodes =
              originalSelectedEpisodes[seasonNumber] || [];

            return (
              currentEpisodes.length !== originalEpisodes.length ||
              currentEpisodes.some((ep) => !originalEpisodes.includes(ep))
            );
          }
        );

        // If we're just approving without changes, use the direct approval endpoint
        if (alsoApproveRequest && !hasSeasonChanges && !hasEpisodeChanges) {
          try {
            await axios.post(`/api/v1/request/${editRequest.id}/approve`);
          } catch (approveError) {
            // Log approval failure for debugging
            // eslint-disable-next-line no-console
            console.error('Direct request approval failed:', {
              requestId: editRequest.id,
              status: approveError.response?.status,
              data: approveError.response?.data,
            });
            throw new Error(
              `Request approval failed: ${
                approveError.response?.data?.message || 'Unknown error'
              }`
            );
          }
        } else {
          // For edit requests with episode-level changes, we need to:
          // 1. Delete the old request
          // 2. Create a new request with the updated episode data
          // This is because the PUT endpoint doesn't support episode-level updates

          // Build seasons payload using the same logic as sendRequest
          const seasonsPayload = [];

          // Add full seasons (prioritize season toggle over episode selections)
          for (const seasonNumber of selectedSeasons) {
            seasonsPayload.push({
              seasonNumber,
              episodes: 'all',
            });
          }

          // Add episode-level requests ONLY if season is NOT selected
          for (const [seasonNumber, episodes] of Object.entries(
            selectedEpisodes
          )) {
            const seasonNum = Number(seasonNumber);
            // Only send episode-level request if season is NOT fully selected
            if (episodes.length > 0 && !selectedSeasons.includes(seasonNum)) {
              seasonsPayload.push({
                seasonNumber: seasonNum,
                episodes: episodes,
              });
            }
          }

          // Use original request settings with proper type validation
          const overrideParams = {
            // Ensure all fields have the correct types expected by the API
            ...(typeof editRequest.serverId === 'number'
              ? { serverId: editRequest.serverId }
              : {}),
            ...(typeof editRequest.profileId === 'number'
              ? { profileId: editRequest.profileId }
              : {}),
            ...(typeof editRequest.rootFolder === 'string'
              ? { rootFolder: editRequest.rootFolder }
              : {}),
            ...(typeof editRequest.languageProfileId === 'number'
              ? { languageProfileId: editRequest.languageProfileId }
              : {}),
            ...(typeof editRequest.requestedBy?.id === 'number'
              ? { userId: editRequest.requestedBy.id }
              : {}),
            ...(Array.isArray(editRequest.tags)
              ? { tags: editRequest.tags }
              : {}),
          };

          // Validate payload before doing anything destructive
          const cleanSeasonsPayload = seasonsPayload.filter(
            (season) =>
              typeof season.seasonNumber === 'number' &&
              !isNaN(season.seasonNumber) &&
              (season.episodes === 'all' || Array.isArray(season.episodes))
          );

          // Create new request payload (using same format as sendRequest)
          const requestPayload = {
            mediaId: data?.id,
            tvdbId: data?.externalIds.tvdbId,
            mediaType: 'tv',
            is4k,
            seasons:
              cleanSeasonsPayload.length > 0
                ? cleanSeasonsPayload
                : selectedSeasons, // Fallback to old format if needed
            ...overrideParams,
          };

          // FIRST: Try to create the new request (without deleting old one yet)
          const response = await axios.post<MediaRequest>(
            '/api/v1/request',
            requestPayload
          );

          // ONLY delete old request if new request was actually created (has an ID)
          if (response.data?.id) {
            try {
              await axios.delete(`/api/v1/request/${editRequest.id}`);
            } catch (deleteError) {
              // Log deletion warning (non-critical)
              // eslint-disable-next-line no-console
              console.warn(
                'Old request deletion failed (may already be gone):',
                {
                  requestId: editRequest.id,
                  status: deleteError.response?.status,
                  data: deleteError.response?.data,
                }
              );
              // Don't throw - the new request was created successfully, which is what matters
            }
          } else {
            throw new Error(
              `Request update failed: No seasons or episodes available to request`
            );
          }

          // If we should also approve, approve the new request
          if (alsoApproveRequest && response.data?.id) {
            try {
              await axios.post(`/api/v1/request/${response.data.id}/approve`);
            } catch (approveError) {
              // Log approval failure for debugging
              // eslint-disable-next-line no-console
              console.error('New request approval failed:', {
                requestId: response.data?.id,
                status: approveError.response?.status,
                data: approveError.response?.data,
              });
              // Don't throw - the request was created successfully, approval can be done manually
            }
          }
        }
      } else {
        await axios.delete(`/api/v1/request/${editRequest.id}`);
      }
      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
      mutate('/api/v1/request/count');

      addToast(
        <span>
          {hasAnyContent
            ? intl.formatMessage(
                alsoApproveRequest
                  ? messages.requestApproved
                  : messages.requestedited,
                {
                  title: data?.name,
                  strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
                }
              )
            : intl.formatMessage(messages.requestcancelled, {
                title: data?.name,
                strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
              })}
        </span>,
        {
          appearance: 'success',
          autoDismiss: true,
        }
      );
      if (onComplete) {
        onComplete(MediaStatus.PENDING);
      }
    } catch (e) {
      // Log request failure for debugging
      // eslint-disable-next-line no-console
      console.error('Request update operation failed:', {
        error: e.message,
        ...(e.response && {
          status: e.response.status,
          data: e.response.data,
        }),
      });
      addToast(<span>{intl.formatMessage(messages.errorediting)}</span>, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      if (onUpdating) {
        onUpdating(false);
      }
    }
  };

  const sendRequest = async () => {
    if (
      settings.currentSettings.partialRequestsEnabled &&
      selectedSeasons.length === 0 &&
      !hasAnySelectedEpisodes()
    ) {
      addToast(<span>{intl.formatMessage(messages.selectseason)}</span>, {
        appearance: 'error',
        autoDismiss: true,
      });
      return;
    }

    if (onUpdating) {
      onUpdating(true);
      mutate('/api/v1/request/count');
    }

    try {
      let overrideParams = {};
      if (requestOverrides) {
        overrideParams = {
          serverId: requestOverrides.server,
          profileId: requestOverrides.profile,
          rootFolder: requestOverrides.folder,
          languageProfileId: requestOverrides.language,
          userId: requestOverrides?.user?.id,
          tags: requestOverrides.tags,
        };
      }
      // Build the new episode-aware seasons format
      const seasonsPayload = [];

      if (settings.currentSettings.partialRequestsEnabled) {
        // Handle partial requests with episode support

        // Add full seasons (prioritize season toggle over episode selections)
        for (const seasonNumber of selectedSeasons) {
          seasonsPayload.push({
            seasonNumber,
            episodes: 'all',
          });
        }

        // Add episode-level requests ONLY if season is NOT selected
        for (const [seasonNumber, episodes] of Object.entries(
          selectedEpisodes
        )) {
          const seasonNum = Number(seasonNumber);
          // Only send episode-level request if season is NOT fully selected
          if (episodes.length > 0 && !selectedSeasons.includes(seasonNum)) {
            seasonsPayload.push({
              seasonNumber: seasonNum,
              episodes: episodes,
            });
          }
        }
      } else {
        // Full series request (old behavior)
        const allSeasons = getAllSeasons().filter(
          (season) => !getAllRequestedSeasons().includes(season) && season !== 0
        );

        for (const seasonNumber of allSeasons) {
          seasonsPayload.push({
            seasonNumber,
            episodes: 'all',
          });
        }
      }

      const response = await axios.post<MediaRequest>('/api/v1/request', {
        mediaId: data?.id,
        tvdbId: tvdbId ?? data?.externalIds.tvdbId,
        mediaType: 'tv',
        is4k,
        seasons: seasonsPayload.length > 0 ? seasonsPayload : selectedSeasons, // Fallback to old format if needed
        ...overrideParams,
      });
      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');

      if (response.data) {
        if (onComplete) {
          onComplete(response.data.media.status);
        }
        // Create detailed success message for episodes
        const episodeCount = getSelectedEpisodesNotInFullSeasons();
        const seasonCount = selectedSeasons.length;

        let toastContent: React.ReactNode;
        if (seasonCount > 0 && episodeCount > 0) {
          toastContent = intl.formatMessage(
            messages.requestSuccessSeasonAndEpisodes,
            {
              title: data?.name,
              seasonCount,
              episodeCount,
              strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
            }
          );
        } else if (seasonCount > 0) {
          toastContent = intl.formatMessage(messages.requestSuccess, {
            title: data?.name,
            strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
          });
        } else if (episodeCount > 0) {
          toastContent = intl.formatMessage(messages.requestSuccessEpisodes, {
            title: data?.name,
            episodeCount,
            strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
          });
        } else {
          toastContent = intl.formatMessage(messages.requestSuccess, {
            title: data?.name,
            strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
          });
        }

        addToast(<span>{toastContent}</span>, {
          appearance: 'success',
          autoDismiss: true,
        });
      }
    } catch (e) {
      addToast(intl.formatMessage(messages.requesterror), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      if (onUpdating) {
        onUpdating(false);
      }
    }
  };

  const getAllSeasons = (): number[] => {
    return (data?.seasons ?? [])
      .filter((season) => season.episodeCount !== 0)
      .map((season) => season.seasonNumber);
  };

  const getAllRequestedSeasons = (): number[] => {
    const requestedSeasons = (data?.mediaInfo?.requests ?? [])
      .filter(
        (request) =>
          request.is4k === is4k &&
          request.status !== MediaRequestStatus.DECLINED &&
          request.status !== MediaRequestStatus.COMPLETED
      )
      .reduce((requestedSeasons, request) => {
        return [
          ...requestedSeasons,
          ...request.seasons
            .filter((season) => !editingSeasons.includes(season.seasonNumber))
            .map((sr) => sr.seasonNumber),
        ];
      }, [] as number[]);

    const availableSeasons = (data?.mediaInfo?.seasons ?? [])
      .filter(
        (season) =>
          (season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE ||
            season[is4k ? 'status4k' : 'status'] ===
              MediaStatus.PARTIALLY_AVAILABLE ||
            season[is4k ? 'status4k' : 'status'] === MediaStatus.PROCESSING) &&
          !requestedSeasons.includes(season.seasonNumber)
      )
      .map((season) => season.seasonNumber);

    return [...requestedSeasons, ...availableSeasons];
  };

  const isSelectedSeason = (seasonNumber: number): boolean =>
    selectedSeasons.includes(seasonNumber);

  // Check if a season is already requested (from any existing request)
  // Exclude seasons from the current edit request to avoid conflicts
  const isSeasonAlreadyRequested = (seasonNumber: number): boolean =>
    existingRequestState.seasons.has(seasonNumber) &&
    !(editRequest && editingSeasons.includes(seasonNumber));

  // Check if any episodes are already requested for a season (from any existing request)
  const hasExistingEpisodes = (seasonNumber: number): boolean =>
    existingRequestState.episodes.has(seasonNumber) &&
    (existingRequestState.episodes.get(seasonNumber)?.size ?? 0) > 0;

  const hasSelectedEpisodes = (seasonNumber: number): boolean => {
    const episodeList = selectedEpisodes[seasonNumber];
    return episodeList && episodeList.length > 0;
  };

  const hasAnySelectedEpisodes = (): boolean => {
    return Object.values(selectedEpisodes).some(
      (episodes) => episodes && episodes.length > 0
    );
  };

  const getTotalSelectedEpisodes = (): number => {
    return Object.values(selectedEpisodes).reduce(
      (total, episodes) => total + (episodes ? episodes.length : 0),
      0
    );
  };

  const getSelectedEpisodesNotInFullSeasons = (): number => {
    return Object.entries(selectedEpisodes).reduce(
      (total, [seasonNumber, episodes]) => {
        const seasonNum = Number(seasonNumber);
        // Only count episodes if the season is NOT fully selected
        if (
          !selectedSeasons.includes(seasonNum) &&
          episodes &&
          episodes.length > 0
        ) {
          return total + episodes.length;
        }
        return total;
      },
      0
    );
  };

  const toggleSeason = (seasonNumber: number): void => {
    // If this season already has a pending request, don't allow it to be toggled
    // Exception: Allow admins to edit existing requests
    if (
      getAllRequestedSeasons().includes(seasonNumber) &&
      !(editRequest && hasPermission(Permission.MANAGE_REQUESTS))
    ) {
      return;
    }

    // If there are no more remaining requests available, block toggle
    if (
      quota?.tv.limit &&
      currentlyRemaining <= 0 &&
      !isSelectedSeason(seasonNumber)
    ) {
      return;
    }

    if (selectedSeasons.includes(seasonNumber)) {
      // Turning OFF season toggle - remove from selected seasons
      setSelectedSeasons((seasons) =>
        seasons.filter((sn) => sn !== seasonNumber)
      );
      // Clear any individual episode selections for this season
      setSelectedEpisodes((prev) => {
        const newSelected = { ...prev };
        delete newSelected[seasonNumber];
        return newSelected;
      });
    } else {
      // Turning ON season toggle - add to selected seasons
      setSelectedSeasons((seasons) => [...seasons, seasonNumber]);
      // Clear any individual episode selections for this season (season takes precedence)
      setSelectedEpisodes((prev) => {
        const newSelected = { ...prev };
        delete newSelected[seasonNumber];
        return newSelected;
      });
    }
  };

  const unrequestedSeasons = getAllSeasons().filter((season) =>
    !settings.currentSettings.partialRequestsEnabled
      ? !getAllRequestedSeasons().includes(season) && season !== 0
      : !getAllRequestedSeasons().includes(season)
  );

  const toggleAllSeasons = (): void => {
    // If the user has a quota and not enough requests for all seasons, block toggleAllSeasons
    if (
      quota?.tv.limit &&
      (quota?.tv.remaining ?? 0) < unrequestedSeasons.length
    ) {
      return;
    }

    const standardUnrequestedSeasons = unrequestedSeasons.filter(
      (seasonNumber) => seasonNumber !== 0
    );

    if (
      data &&
      selectedSeasons.length >= 0 &&
      selectedSeasons.length < standardUnrequestedSeasons.length
    ) {
      setSelectedSeasons(standardUnrequestedSeasons);
    } else {
      setSelectedSeasons([]);
    }
  };

  const isAllSeasons = (): boolean => {
    if (!data) {
      return false;
    }
    return (
      selectedSeasons.filter((season) => season !== 0).length ===
      getAllSeasons().filter(
        (season) => !getAllRequestedSeasons().includes(season) && season !== 0
      ).length
    );
  };

  // Episode-level management functions
  const toggleEpisodeMode = (seasonNumber: number): void => {
    const newEpisodeModeSeasons = new Set(episodeModeSeasons);

    if (episodeModeSeasons.has(seasonNumber)) {
      // Switching back to full season mode - close episode view
      newEpisodeModeSeasons.delete(seasonNumber);
      // DON'T clear episode selections - preserve them when collapsing accordion
    } else {
      // Switching to episode mode - open episode view
      newEpisodeModeSeasons.add(seasonNumber);
      // DON'T remove from full season selection - keep the season toggle status
      // If season is selected, select all episodes cosmetically
      if (isSelectedSeason(seasonNumber)) {
        // Will be handled by the effect in EpisodeAccordion
      }
    }

    setEpisodeModeSeasons(newEpisodeModeSeasons);
  };

  const toggleEpisode = (seasonNumber: number, episodeNumber: number): void => {
    setSelectedEpisodes((prev) => {
      const seasonEpisodes = prev[seasonNumber] || [];
      const newSeasonEpisodes = seasonEpisodes.includes(episodeNumber)
        ? seasonEpisodes.filter((ep) => ep !== episodeNumber)
        : [...seasonEpisodes, episodeNumber];

      const newState = {
        ...prev,
        [seasonNumber]: newSeasonEpisodes,
      };

      // Check if all episodes in the season are now selected
      // We'll do this asynchronously after the state update
      setTimeout(async () => {
        await checkForFullSeasonSelection(seasonNumber, newSeasonEpisodes);
      }, 0);

      return newState;
    });
  };

  const checkForFullSeasonSelection = async (
    seasonNumber: number,
    currentSelectedEpisodes: number[]
  ) => {
    try {
      // Don't optimize if season is already fully selected
      if (
        selectedSeasons.includes(seasonNumber) ||
        existingRequestState.seasons.has(seasonNumber)
      ) {
        return;
      }

      // Fetch season data to get total episode count
      const response = await fetch(
        `/api/v1/tv/${data?.id}/season/${seasonNumber}`
      );
      if (!response.ok) return;

      const seasonData: SeasonWithEpisodes = await response.json();
      const totalEpisodes = seasonData.episodes.length;

      // Get existing episode requests for this season
      const existingEpisodes =
        existingRequestState.episodes.get(seasonNumber) || new Set();

      // Combine current selections with existing episode requests
      const allSelectedEpisodes = new Set([
        ...currentSelectedEpisodes,
        ...Array.from(existingEpisodes),
      ]);

      // If all episodes are selected (including existing requests), convert to full season request
      if (allSelectedEpisodes.size === totalEpisodes && totalEpisodes > 0) {
        // Add to full season selection
        setSelectedSeasons((prev) => {
          if (!prev.includes(seasonNumber)) {
            return [...prev, seasonNumber];
          }
          return prev;
        });

        // Remove individual episode selections for this season
        setSelectedEpisodes((prev) => {
          const newState = { ...prev };
          delete newState[seasonNumber];
          return newState;
        });
      }
    } catch (error) {
      // Error already handled by notification system
    }
  };

  const isOwner = editRequest && editRequest.requestedBy.id === user?.id;

  return data && !error && !data.externalIds.tvdbId && searchModal.show ? (
    <SearchByNameModal
      tvdbId={tvdbId}
      setTvdbId={setTvdbId}
      closeModal={() => setSearchModal({ show: false })}
      onCancel={onCancel}
      modalTitle={intl.formatMessage(
        is4k ? messages.requestseries4ktitle : messages.requestseriestitle
      )}
      modalSubTitle={data.name}
      tmdbId={tmdbId}
      backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
    />
  ) : (
    <Modal
      loading={!data && !error}
      backgroundClickable
      onCancel={tvdbId ? () => setSearchModal({ show: true }) : onCancel}
      onOk={() => {
        return editRequest
          ? hasPermission(Permission.MANAGE_REQUESTS)
            ? updateRequest(true)
            : updateRequest()
          : sendRequest();
      }}
      title={intl.formatMessage(
        editRequest
          ? is4k
            ? messages.pending4krequest
            : messages.pendingrequest
          : is4k
          ? messages.requestseries4ktitle
          : messages.requestseriestitle
      )}
      subTitle={data?.name}
      okText={
        editRequest
          ? selectedSeasons.length === 0 && !hasAnySelectedEpisodes()
            ? intl.formatMessage(messages.cancel)
            : hasPermission(Permission.MANAGE_REQUESTS)
            ? intl.formatMessage(messages.approve)
            : intl.formatMessage(messages.edit)
          : getAllRequestedSeasons().length >= getAllSeasons().length
          ? intl.formatMessage(messages.alreadyrequested)
          : !settings.currentSettings.partialRequestsEnabled
          ? intl.formatMessage(
              is4k ? globalMessages.request4k : globalMessages.request
            )
          : selectedSeasons.length === 0 && !hasAnySelectedEpisodes()
          ? intl.formatMessage(messages.selectseason)
          : selectedSeasons.length > 0 &&
            getSelectedEpisodesNotInFullSeasons() > 0
          ? intl.formatMessage(messages.requestseasonsandepisodes, {
              seasonCount: selectedSeasons.length,
              episodeCount: getSelectedEpisodesNotInFullSeasons(),
            })
          : selectedSeasons.length > 0
          ? intl.formatMessage(
              is4k ? messages.requestseasons4k : messages.requestseasons,
              {
                seasonCount: selectedSeasons.length,
              }
            )
          : intl.formatMessage(messages.requestepisodes, {
              episodeCount: getTotalSelectedEpisodes(),
            })
      }
      okDisabled={
        editRequest
          ? false
          : !settings.currentSettings.partialRequestsEnabled &&
            quota?.tv.limit &&
            unrequestedSeasons.length > quota.tv.limit
          ? true
          : getAllRequestedSeasons().length >= getAllSeasons().length ||
            (settings.currentSettings.partialRequestsEnabled &&
              selectedSeasons.length === 0 &&
              !hasAnySelectedEpisodes()) ||
            (!settings.currentSettings.partialRequestsEnabled &&
              selectedSeasons.length === 0)
      }
      okButtonType={
        editRequest
          ? settings.currentSettings.partialRequestsEnabled &&
            selectedSeasons.length === 0 &&
            !hasAnySelectedEpisodes()
            ? 'danger'
            : hasPermission(Permission.MANAGE_REQUESTS)
            ? 'success'
            : 'primary'
          : 'primary'
      }
      cancelText={
        editRequest
          ? intl.formatMessage(globalMessages.close)
          : tvdbId
          ? intl.formatMessage(globalMessages.back)
          : intl.formatMessage(globalMessages.cancel)
      }
      backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
    >
      {editRequest
        ? isOwner
          ? intl.formatMessage(messages.pendingapproval)
          : intl.formatMessage(messages.requestfrom, {
              username: editRequest?.requestedBy.displayName,
            })
        : null}
      {hasPermission(
        [
          Permission.MANAGE_REQUESTS,
          is4k ? Permission.AUTO_APPROVE_4K : Permission.AUTO_APPROVE,
          is4k ? Permission.AUTO_APPROVE_4K_TV : Permission.AUTO_APPROVE_TV,
        ],
        { type: 'or' }
      ) &&
        !(
          quota?.tv.limit &&
          !settings.currentSettings.partialRequestsEnabled &&
          unrequestedSeasons.length > (quota?.tv.remaining ?? 0)
        ) &&
        getAllRequestedSeasons().length < getAllSeasons().length &&
        !editRequest && (
          <div className="mt-6">
            <Alert
              title={intl.formatMessage(messages.requestadmin)}
              type="info"
            />
          </div>
        )}
      {(quota?.tv.limit ?? 0) > 0 && (
        <QuotaDisplay
          mediaType="tv"
          quota={quota?.tv}
          remaining={
            !settings.currentSettings.partialRequestsEnabled &&
            unrequestedSeasons.length > (quota?.tv.remaining ?? 0)
              ? 0
              : currentlyRemaining
          }
          userOverride={
            requestOverrides?.user && requestOverrides.user.id !== user?.id
              ? requestOverrides?.user?.id
              : undefined
          }
          overLimit={
            !settings.currentSettings.partialRequestsEnabled &&
            unrequestedSeasons.length > (quota?.tv.remaining ?? 0)
              ? unrequestedSeasons.length
              : undefined
          }
        />
      )}
      <div className="flex flex-col">
        <div className="-mx-4 sm:mx-0">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden border border-gray-700 shadow backdrop-blur sm:rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th
                      className={`w-16 bg-gray-700 bg-opacity-80 px-4 py-3 ${
                        !settings.currentSettings.partialRequestsEnabled &&
                        'hidden'
                      }`}
                    >
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
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center pt-2 focus:outline-none ${
                          quota?.tv.remaining &&
                          quota.tv.limit &&
                          quota.tv.remaining < unrequestedSeasons.length
                            ? 'opacity-50'
                            : ''
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            isAllSeasons() ? 'bg-indigo-500' : 'bg-gray-800'
                          } absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out`}
                        ></span>
                        <span
                          aria-hidden="true"
                          className={`${
                            isAllSeasons() ? 'translate-x-5' : 'translate-x-0'
                          } absolute left-0 inline-block h-5 w-5 rounded-full border border-gray-200 bg-white shadow transition-transform duration-200 ease-in-out group-focus:border-blue-300 group-focus:ring`}
                        ></span>
                      </span>
                    </th>
                    <th className="bg-gray-700 bg-opacity-80 px-1 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-200 md:px-6">
                      {intl.formatMessage(messages.season)}
                    </th>
                    <th className="bg-gray-700 bg-opacity-80 px-5 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-200 md:px-6">
                      {intl.formatMessage(messages.numberofepisodes)}
                    </th>
                    <th className="bg-gray-700 bg-opacity-80 px-2 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-200 md:px-6">
                      {intl.formatMessage(globalMessages.status)}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data?.seasons
                    .filter((season) =>
                      !settings.currentSettings.partialRequestsEnabled
                        ? season.episodeCount !== 0 && season.seasonNumber !== 0
                        : season.episodeCount !== 0
                    )
                    .map((season) => {
                      // const seasonRequest = getSeasonRequest(
                      //   season.seasonNumber
                      // );
                      const mediaSeason = data?.mediaInfo?.seasons.find(
                        (sn) =>
                          sn.seasonNumber === season.seasonNumber &&
                          sn[is4k ? 'status4k' : 'status'] !==
                            MediaStatus.UNKNOWN &&
                          sn[is4k ? 'status4k' : 'status'] !==
                            MediaStatus.DELETED
                      );
                      return (
                        <React.Fragment key={`season-${season.id}`}>
                          <tr
                            className="cursor-pointer hover:bg-gray-800 hover:bg-opacity-30"
                            onClick={() =>
                              toggleEpisodeMode(season.seasonNumber)
                            }
                          >
                            <td
                              className={`whitespace-nowrap px-4 py-4 text-sm font-medium leading-5 text-gray-100 ${
                                !settings.currentSettings
                                  .partialRequestsEnabled && 'hidden'
                              }`}
                            >
                              <span
                                role="checkbox"
                                tabIndex={0}
                                data-testid="season-toggle"
                                aria-checked={
                                  (!!mediaSeason &&
                                    !(
                                      editRequest &&
                                      hasPermission(Permission.MANAGE_REQUESTS)
                                    )) ||
                                  (isSeasonAlreadyRequested(
                                    season.seasonNumber
                                  ) &&
                                    !(
                                      editRequest &&
                                      hasPermission(Permission.MANAGE_REQUESTS)
                                    )) ||
                                  isSelectedSeason(season.seasonNumber)
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    !isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) ||
                                    (editRequest &&
                                      hasPermission(Permission.MANAGE_REQUESTS))
                                  ) {
                                    toggleSeason(season.seasonNumber);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Space') {
                                    e.stopPropagation();
                                    if (
                                      !isSeasonAlreadyRequested(
                                        season.seasonNumber
                                      ) ||
                                      (editRequest &&
                                        hasPermission(
                                          Permission.MANAGE_REQUESTS
                                        ))
                                    ) {
                                      toggleSeason(season.seasonNumber);
                                    }
                                  }
                                }}
                                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center pt-2 focus:outline-none ${
                                  (mediaSeason &&
                                    !(
                                      editRequest &&
                                      hasPermission(Permission.MANAGE_REQUESTS)
                                    )) ||
                                  (isSeasonAlreadyRequested(
                                    season.seasonNumber
                                  ) &&
                                    !(
                                      editRequest &&
                                      hasPermission(Permission.MANAGE_REQUESTS)
                                    )) ||
                                  (quota?.tv.limit &&
                                    currentlyRemaining <= 0 &&
                                    !isSelectedSeason(season.seasonNumber))
                                    ? 'opacity-50'
                                    : ''
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`${
                                    (!!mediaSeason &&
                                      !(
                                        editRequest &&
                                        hasPermission(
                                          Permission.MANAGE_REQUESTS
                                        )
                                      )) ||
                                    (isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) &&
                                      !(
                                        editRequest &&
                                        hasPermission(
                                          Permission.MANAGE_REQUESTS
                                        )
                                      )) ||
                                    isSelectedSeason(season.seasonNumber)
                                      ? 'bg-indigo-500'
                                      : 'bg-gray-700'
                                  } absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out`}
                                ></span>
                                <span
                                  aria-hidden="true"
                                  className={`${
                                    (!!mediaSeason &&
                                      !(
                                        editRequest &&
                                        hasPermission(
                                          Permission.MANAGE_REQUESTS
                                        )
                                      )) ||
                                    (isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) &&
                                      !(
                                        editRequest &&
                                        hasPermission(
                                          Permission.MANAGE_REQUESTS
                                        )
                                      )) ||
                                    isSelectedSeason(season.seasonNumber)
                                      ? 'translate-x-5'
                                      : 'translate-x-0'
                                  } absolute left-0 inline-block h-5 w-5 rounded-full border border-gray-200 bg-white shadow transition-transform duration-200 ease-in-out group-focus:border-blue-300 group-focus:ring`}
                                ></span>
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-1 py-4 text-sm font-medium leading-5 text-gray-100 md:px-6">
                              {season.seasonNumber === 0
                                ? intl.formatMessage(globalMessages.specials)
                                : intl.formatMessage(messages.seasonnumber, {
                                    number: season.seasonNumber,
                                  })}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm leading-5 text-gray-200 md:px-6">
                              {season.episodeCount}
                            </td>
                            <td className="whitespace-nowrap py-4 pr-2 text-sm leading-5 text-gray-200 md:px-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  {!mediaSeason &&
                                    isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) && (
                                      <Badge badgeType="primary">
                                        {intl.formatMessage(
                                          globalMessages.requested
                                        )}
                                      </Badge>
                                    )}
                                  {!mediaSeason &&
                                    !isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) &&
                                    isSelectedSeason(season.seasonNumber) && (
                                      <Badge badgeType="warning">
                                        {intl.formatMessage(
                                          globalMessages.pending
                                        )}
                                      </Badge>
                                    )}
                                  {!mediaSeason &&
                                    !isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) &&
                                    !isSelectedSeason(season.seasonNumber) &&
                                    (hasExistingEpisodes(season.seasonNumber) ||
                                      hasSelectedEpisodes(
                                        season.seasonNumber
                                      )) && (
                                      <Badge badgeType="warning">
                                        {intl.formatMessage(
                                          globalMessages.partiallyrequested
                                        )}
                                      </Badge>
                                    )}
                                  {!mediaSeason &&
                                    !isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) &&
                                    !isSelectedSeason(season.seasonNumber) &&
                                    !hasSelectedEpisodes(season.seasonNumber) &&
                                    !hasExistingEpisodes(
                                      season.seasonNumber
                                    ) && (
                                      <Badge>
                                        {intl.formatMessage(
                                          globalMessages.notrequested
                                        )}
                                      </Badge>
                                    )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEpisodeMode(season.seasonNumber);
                                  }}
                                  className="ml-2 p-1 text-gray-400 hover:text-gray-200 focus:outline-none"
                                  title="Toggle episode selection"
                                >
                                  {episodeModeSeasons.has(
                                    season.seasonNumber
                                  ) ? (
                                    <svg
                                      className="h-4 w-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-4 w-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Episode Accordion Row */}
                          {episodeModeSeasons.has(season.seasonNumber) && (
                            <tr key={`episode-accordion-${season.id}`}>
                              <td
                                colSpan={4}
                                className="p-0"
                                data-testid="episode-accordion"
                              >
                                <EpisodeSelector
                                  tvId={tmdbId}
                                  seasonNumber={season.seasonNumber}
                                  selectedEpisodes={
                                    selectedEpisodes[season.seasonNumber] || []
                                  }
                                  episodeRequests={(() => {
                                    // Get all existing episode requests for this season from all requests
                                    // Use data.mediaInfo.requests (from SWR) instead of media prop
                                    const allEpisodeRequests: EpisodeRequest[] =
                                      [];
                                    const requestsSource =
                                      data?.mediaInfo?.requests ||
                                      media?.requests ||
                                      [];

                                    requestsSource.forEach((request) => {
                                      if (
                                        request.is4k === is4k &&
                                        request.status !==
                                          MediaRequestStatus.DECLINED
                                      ) {
                                        request.episodes?.forEach((episode) => {
                                          if (
                                            episode.seasonNumber ===
                                            season.seasonNumber
                                          ) {
                                            allEpisodeRequests.push(episode);
                                          }
                                        });
                                      }
                                    });
                                    return allEpisodeRequests;
                                  })()}
                                  onEpisodeToggle={(episodeNumber) =>
                                    toggleEpisode(
                                      season.seasonNumber,
                                      episodeNumber
                                    )
                                  }
                                  disabled={
                                    (!!mediaSeason &&
                                      !(
                                        editRequest &&
                                        hasPermission(
                                          Permission.MANAGE_REQUESTS
                                        )
                                      )) ||
                                    (isSeasonAlreadyRequested(
                                      season.seasonNumber
                                    ) &&
                                      !(
                                        editRequest &&
                                        hasPermission(
                                          Permission.MANAGE_REQUESTS
                                        )
                                      ))
                                  }
                                  isSeasonSelected={isSelectedSeason(
                                    season.seasonNumber
                                  )}
                                  isSeasonAlreadyRequested={isSeasonAlreadyRequested(
                                    season.seasonNumber
                                  )}
                                  seasonRequestStatus={(() => {
                                    // Find the season request status for this season
                                    let seasonStatus:
                                      | MediaRequestStatus
                                      | undefined = undefined;
                                    media?.requests?.forEach((request) => {
                                      if (
                                        request.is4k === is4k &&
                                        request.status !==
                                          MediaRequestStatus.DECLINED
                                      ) {
                                        request.seasons?.forEach(
                                          (seasonReq) => {
                                            if (
                                              seasonReq.seasonNumber ===
                                              season.seasonNumber
                                            ) {
                                              seasonStatus = seasonReq.status;
                                            }
                                          }
                                        );
                                      }
                                    });
                                    return seasonStatus;
                                  })()}
                                  canManageRequests={hasPermission(
                                    Permission.MANAGE_REQUESTS
                                  )}
                                  editRequest={editRequest}
                                  allRequests={
                                    data?.mediaInfo?.requests ||
                                    media?.requests ||
                                    []
                                  }
                                  onSeasonDeselect={async (
                                    episodeToDeselect: number
                                  ) => {
                                    // When converting from full season to individual episodes, excluding the clicked episode
                                    try {
                                      const response = await fetch(
                                        `/api/v1/tv/${tmdbId}/season/${season.seasonNumber}`
                                      );
                                      if (response.ok) {
                                        const seasonData: SeasonWithEpisodes =
                                          await response.json();
                                        const allEpisodeNumbers =
                                          seasonData.episodes.map(
                                            (ep) => ep.episodeNumber
                                          );
                                        // Remove the episode that was clicked to deselect
                                        const episodesExceptClicked =
                                          allEpisodeNumbers.filter(
                                            (ep) => ep !== episodeToDeselect
                                          );

                                        // Atomically update both states
                                        setSelectedSeasons((seasons) =>
                                          seasons.filter(
                                            (sn) => sn !== season.seasonNumber
                                          )
                                        );
                                        setSelectedEpisodes((prev) => ({
                                          ...prev,
                                          [season.seasonNumber]:
                                            episodesExceptClicked,
                                        }));
                                      }
                                    } catch (error) {
                                      // Error fetching season data for episode conversion
                                    }
                                  }}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {(hasPermission(Permission.REQUEST_ADVANCED) ||
        hasPermission(Permission.MANAGE_REQUESTS)) && (
        <AdvancedRequester
          type="tv"
          is4k={is4k}
          isAnime={data?.keywords.some(
            (keyword) => keyword.id === ANIME_KEYWORD_ID
          )}
          onChange={(overrides) => setRequestOverrides(overrides)}
          requestUser={editRequest?.requestedBy}
          defaultOverrides={
            editRequest
              ? {
                  folder: editRequest.rootFolder,
                  profile: editRequest.profileId,
                  server: editRequest.serverId,
                  language: editRequest.languageProfileId,
                  tags: editRequest.tags,
                }
              : undefined
          }
        />
      )}
    </Modal>
  );
};

export default TvRequestModal;
