import Spinner from '@app/assets/spinner.svg';
import Badge from '@app/components/Common/Badge';
import Tooltip from '@app/components/Common/Tooltip';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import { MediaStatus } from '@server/constants/media';
import type { DownloadingItem } from '@server/lib/downloadtracker';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  status: '{status}',
  status4k: '4K {status}',
  playonplex: 'Play on Plex',
  openinarr: 'Open in {arr}',
  managemedia: 'Manage {mediaType}',
  seasonepisodenumber: 'S{seasonNumber}E{episodeNumber}',
});

interface StatusBadgeProps {
  status?: MediaStatus;
  downloadItem?: DownloadingItem;
  is4k?: boolean;
  inProgress?: boolean;
  plexUrl?: string;
  serviceUrl?: string;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  downloadBlock?: React.ReactNode;
}

const StatusBadge = ({
  status,
  downloadItem,
  is4k = false,
  inProgress = false,
  plexUrl,
  serviceUrl,
  tmdbId,
  mediaType,
  downloadBlock,
}: StatusBadgeProps) => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const settings = useSettings();

  let mediaLink: string | undefined;
  let mediaLinkDescription: string | undefined;

  const calculateDownloadProgress = (media: DownloadingItem) => {
    return Math.round(((media.size - media.sizeLeft) / media.size) * 100);
  };

  if (
    mediaType &&
    plexUrl &&
    hasPermission(
      is4k
        ? [
            Permission.REQUEST_4K,
            mediaType === 'movie'
              ? Permission.REQUEST_4K_MOVIE
              : Permission.REQUEST_4K_TV,
          ]
        : [
            Permission.REQUEST,
            mediaType === 'movie'
              ? Permission.REQUEST_MOVIE
              : Permission.REQUEST_TV,
          ],
      {
        type: 'or',
      }
    ) &&
    (!is4k ||
      (mediaType === 'movie'
        ? settings.currentSettings.movie4kEnabled
        : settings.currentSettings.series4kEnabled))
  ) {
    mediaLink = plexUrl;
    mediaLinkDescription = intl.formatMessage(messages.playonplex);
  } else if (hasPermission(Permission.MANAGE_REQUESTS)) {
    if (mediaType && tmdbId) {
      mediaLink = `/${mediaType}/${tmdbId}?manage=1`;
      mediaLinkDescription = intl.formatMessage(messages.managemedia, {
        mediaType: intl.formatMessage(
          mediaType === 'movie' ? globalMessages.movie : globalMessages.tvshow
        ),
      });
    } else if (hasPermission(Permission.ADMIN) && serviceUrl) {
      mediaLink = serviceUrl;
      mediaLinkDescription = intl.formatMessage(messages.openinarr, {
        arr: mediaType === 'movie' ? 'Radarr' : 'Sonarr',
      });
    }
  }

  switch (status) {
    case MediaStatus.AVAILABLE:
      return (
        <Tooltip
          content={
            inProgress && downloadItem ? downloadBlock : mediaLinkDescription
          }
          className={`${
            inProgress && 'hidden max-h-96 w-96 overflow-scroll sm:block'
          }`}
          tooltipConfig={{ interactive: true, delayHide: 100 }}
        >
          <Badge
            badgeType="success"
            href={mediaLink}
            className={`${
              inProgress &&
              '!bg-gray-700 !bg-opacity-80 !px-0 hover:!bg-gray-700'
            } overflow-hidden`}
          >
            <div
              className={`${
                inProgress &&
                'flex bg-green-500 transition-all duration-200 ease-in-out'
              }`}
              style={{
                width: `${
                  downloadItem ? calculateDownloadProgress(downloadItem) : 0
                }%`,
              }}
            >
              <div className={`flex items-center ${inProgress && 'px-2'}`}>
                <span>
                  {intl.formatMessage(
                    is4k ? messages.status4k : messages.status,
                    {
                      status: inProgress
                        ? intl.formatMessage(globalMessages.processing)
                        : intl.formatMessage(globalMessages.available),
                    }
                  )}
                </span>
                {inProgress && (
                  <>
                    {mediaType === 'tv' && (
                      <span className="ml-1">
                        {intl.formatMessage(messages.seasonepisodenumber, {
                          seasonNumber: downloadItem?.episode?.seasonNumber,
                          episodeNumber: downloadItem?.episode?.episodeNumber,
                        })}
                      </span>
                    )}
                    <Spinner className="ml-1 h-3 w-3" />
                  </>
                )}
              </div>
            </div>
          </Badge>
        </Tooltip>
      );

    case MediaStatus.PARTIALLY_AVAILABLE:
      return (
        <Tooltip
          content={
            inProgress && downloadItem ? downloadBlock : mediaLinkDescription
          }
          className={`${
            inProgress && 'hidden max-h-96 w-96 overflow-scroll sm:block'
          }`}
          tooltipConfig={{ interactive: true, delayHide: 100 }}
        >
          <Badge
            badgeType="success"
            href={mediaLink}
            className={`${
              inProgress &&
              '!bg-gray-700 !bg-opacity-80 !px-0 hover:!bg-gray-700'
            } overflow-hidden`}
          >
            <div
              className={`${
                inProgress &&
                'flex bg-green-500 transition-all duration-200 ease-in-out'
              }`}
              style={{
                width: `${
                  downloadItem ? calculateDownloadProgress(downloadItem) : 0
                }%`,
              }}
            >
              <div className={`flex items-center ${inProgress && 'px-2'}`}>
                <span>
                  {intl.formatMessage(
                    is4k ? messages.status4k : messages.status,
                    {
                      status: inProgress
                        ? intl.formatMessage(globalMessages.processing)
                        : intl.formatMessage(globalMessages.partiallyavailable),
                    }
                  )}
                </span>
                {inProgress && (
                  <>
                    {mediaType === 'tv' && (
                      <span className="ml-1">
                        {intl.formatMessage(messages.seasonepisodenumber, {
                          seasonNumber: downloadItem?.episode?.seasonNumber,
                          episodeNumber: downloadItem?.episode?.episodeNumber,
                        })}
                      </span>
                    )}
                    <Spinner className="ml-1 h-3 w-3" />
                  </>
                )}
              </div>
            </div>
          </Badge>
        </Tooltip>
      );

    case MediaStatus.PROCESSING:
      return (
        <Tooltip
          content={
            inProgress && downloadItem ? downloadBlock : mediaLinkDescription
          }
          className={`${
            inProgress && 'hidden max-h-96 w-96 overflow-scroll sm:block'
          }`}
          tooltipConfig={{ interactive: true, delayHide: 100 }}
        >
          <Badge
            badgeType="primary"
            href={mediaLink}
            className={`${
              inProgress &&
              '!bg-gray-700 !bg-opacity-80 !px-0 hover:!bg-gray-700'
            } overflow-hidden`}
          >
            <div
              className={`${
                inProgress &&
                'flex bg-indigo-500 transition-all duration-200 ease-in-out'
              }`}
              style={{
                width: `${
                  downloadItem ? calculateDownloadProgress(downloadItem) : 0
                }%`,
              }}
            >
              <div className={`flex items-center ${inProgress && 'px-2'}`}>
                <span>
                  {intl.formatMessage(
                    is4k ? messages.status4k : messages.status,
                    {
                      status: inProgress
                        ? intl.formatMessage(globalMessages.processing)
                        : intl.formatMessage(globalMessages.requested),
                    }
                  )}
                </span>
                {inProgress && (
                  <>
                    {mediaType === 'tv' && (
                      <span className="ml-1">
                        {intl.formatMessage(messages.seasonepisodenumber, {
                          seasonNumber: downloadItem?.episode?.seasonNumber,
                          episodeNumber: downloadItem?.episode?.episodeNumber,
                        })}
                      </span>
                    )}
                    <Spinner className="ml-1 h-3 w-3" />
                  </>
                )}
              </div>
            </div>
          </Badge>
        </Tooltip>
      );

    case MediaStatus.PENDING:
      return (
        <Tooltip content={mediaLinkDescription}>
          <Badge badgeType="warning" href={mediaLink}>
            {intl.formatMessage(is4k ? messages.status4k : messages.status, {
              status: intl.formatMessage(globalMessages.pending),
            })}
          </Badge>
        </Tooltip>
      );

    default:
      return null;
  }
};

export default StatusBadge;
