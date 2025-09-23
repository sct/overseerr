import AirDateBadge from '@app/components/AirDateBadge';
import Badge from '@app/components/Common/Badge';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import globalMessages from '@app/i18n/globalMessages';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';
import type { SeasonWithEpisodes } from '@server/models/Tv';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  somethingwentwrong: 'Something went wrong while retrieving season data.',
  noepisodes: 'Episode list unavailable.',
});

type SeasonProps = {
  seasonNumber: number;
  tvId: number;
  media?: Media;
};

const Season = ({ seasonNumber, tvId, media }: SeasonProps) => {
  const intl = useIntl();
  const { data, error } = useSWR<SeasonWithEpisodes>(
    `/api/v1/tv/${tvId}/season/${seasonNumber}`
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <div>{intl.formatMessage(messages.somethingwentwrong)}</div>;
  }

  // Helper function to get episode status (Priority: Individual Request > Season Request > Season Availability)
  const getEpisodeStatus = (episodeNumber: number) => {
    if (!media?.requests) {
      return null;
    }

    // Find the season in media to check availability status
    const mSeason = media.seasons?.find((s) => s.seasonNumber === seasonNumber);

    // Priority 1: Check individual episode request status FIRST
    for (const request of media.requests) {
      if (request.status === MediaRequestStatus.DECLINED) continue;

      const episodeRequest = request.episodes?.find(
        (ep) =>
          ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
      );

      if (episodeRequest) {
        // Episode is specifically requested - check its completion status
        if (episodeRequest.status === MediaRequestStatus.COMPLETED) {
          return { type: 'availability', status: MediaStatus.AVAILABLE };
        }

        // Always show approved status for approved episodes
        if (episodeRequest.status === MediaRequestStatus.APPROVED) {
          return { type: 'request', status: MediaRequestStatus.APPROVED };
        }

        return { type: 'request', status: episodeRequest.status };
      }
    }

    // Priority 2: Check if entire season is requested (before checking availability)
    for (const request of media.requests) {
      if (request.status === MediaRequestStatus.DECLINED) continue;

      const seasonRequest = request.seasons?.find(
        (season) => season.seasonNumber === seasonNumber
      );

      if (seasonRequest) {
        // Season is requested - check its completion status
        if (seasonRequest.status === MediaRequestStatus.COMPLETED) {
          return { type: 'availability', status: MediaStatus.AVAILABLE };
        }
        return { type: 'request', status: seasonRequest.status };
      }
    }

    // Priority 3: Check if entire season is available (all episodes downloaded)
    if (mSeason?.status === MediaStatus.AVAILABLE) {
      return { type: 'availability', status: MediaStatus.AVAILABLE };
    }

    // Priority 4: Check if season is processing (active downloads)
    if (mSeason?.status === MediaStatus.PROCESSING) {
      return { type: 'availability', status: MediaStatus.PROCESSING };
    }

    // DON'T show PARTIALLY_AVAILABLE from season status for individual episodes
    // This prevents unrequested episodes from showing as "partially available"
    // when they should show no status. PARTIALLY_AVAILABLE season status
    // is often incorrect for pending requests.

    return null;
  };

  // Helper function to create status badge
  const getStatusBadge = (
    statusInfo: {
      type: string;
      status: MediaStatus | MediaRequestStatus;
    } | null
  ) => {
    if (!statusInfo) return null;

    if (statusInfo.type === 'availability') {
      // Show availability status (like seasons)
      switch (statusInfo.status) {
        case MediaStatus.AVAILABLE:
          return (
            <Badge badgeType="success">
              {intl.formatMessage(globalMessages.available)}
            </Badge>
          );
        case MediaStatus.PARTIALLY_AVAILABLE:
          return (
            <Badge badgeType="success">
              {intl.formatMessage(globalMessages.partiallyavailable)}
            </Badge>
          );
        case MediaStatus.PROCESSING:
          return (
            <Badge badgeType="primary">
              {intl.formatMessage(globalMessages.processing)}
            </Badge>
          );
        default:
          return null;
      }
    } else {
      // Show request status
      switch (statusInfo.status) {
        case MediaRequestStatus.PENDING:
          return (
            <Badge badgeType="warning">
              {intl.formatMessage(globalMessages.pending)}
            </Badge>
          );
        case MediaRequestStatus.APPROVED:
          return (
            <Badge badgeType="primary">
              {intl.formatMessage(globalMessages.requested)}
            </Badge>
          );
        case MediaRequestStatus.FAILED:
          return (
            <Badge badgeType="danger">
              {intl.formatMessage(globalMessages.failed)}
            </Badge>
          );
        case MediaRequestStatus.DECLINED:
          return (
            <Badge badgeType="danger">
              {intl.formatMessage(globalMessages.declined)}
            </Badge>
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="flex flex-col justify-center divide-y divide-gray-700">
      {data.episodes.length === 0 ? (
        <p>{intl.formatMessage(messages.noepisodes)}</p>
      ) : (
        data.episodes
          .slice()
          .reverse()
          .map((episode) => {
            const episodeStatusInfo = getEpisodeStatus(episode.episodeNumber);
            const statusBadge = getStatusBadge(episodeStatusInfo);

            return (
              <div
                className="flex flex-col space-y-4 py-4 xl:flex-row xl:space-y-4 xl:space-x-4"
                key={`season-${seasonNumber}-episode-${episode.episodeNumber}`}
              >
                <div className="flex-1">
                  <div className="flex flex-col space-y-2 xl:flex-row xl:items-center xl:space-y-0 xl:space-x-2">
                    <h3 className="text-lg">
                      {episode.episodeNumber} - {episode.name}
                    </h3>
                    {episode.airDate && (
                      <AirDateBadge airDate={episode.airDate} />
                    )}
                    {statusBadge && <div className="flex">{statusBadge}</div>}
                  </div>
                  {episode.overview && <p>{episode.overview}</p>}
                </div>
                {episode.stillPath && (
                  <img
                    className="h-auto w-full rounded-lg xl:h-32 xl:w-auto"
                    src={`https://image.tmdb.org/t/p/original/${episode.stillPath}`}
                    alt=""
                  />
                )}
              </div>
            );
          })
      )}
    </div>
  );
};

export default Season;
