import { ServerIcon, ViewListIcon } from '@heroicons/react/outline';
import { CheckCircleIcon, DocumentRemoveIcon } from '@heroicons/react/solid';
import axios from 'axios';
import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import { IssueStatus } from '../../../server/constants/issue';
import {
  MediaRequestStatus,
  MediaStatus,
} from '../../../server/constants/media';
import { MediaWatchDataResponse } from '../../../server/interfaces/api/mediaInterfaces';
import { MovieDetails } from '../../../server/models/Movie';
import { TvDetails } from '../../../server/models/Tv';
import useSettings from '../../hooks/useSettings';
import { Permission, useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import Button from '../Common/Button';
import ConfirmButton from '../Common/ConfirmButton';
import SlideOver from '../Common/SlideOver';
import DownloadBlock from '../DownloadBlock';
import IssueBlock from '../IssueBlock';
import RequestBlock from '../RequestBlock';

const messages = defineMessages({
  manageModalTitle: 'Manage {mediaType}',
  manageModalIssues: 'Open Issues',
  manageModalRequests: 'Requests',
  manageModalMedia: 'Media',
  manageModalAdvanced: 'Advanced',
  manageModalNoRequests: 'No requests.',
  manageModalClearMedia: 'Clear Data',
  manageModalClearMediaWarning:
    '* This will irreversibly remove all data for this {mediaType}, including any requests. If this item exists in your Plex library, the media information will be recreated during the next scan.',
  openarr: 'Open in {arr}',
  openarr4k: 'Open in 4K {arr}',
  downloadstatus: 'Downloads',
  markavailable: 'Mark as Available',
  mark4kavailable: 'Mark as Available in 4K',
  markallseasonsavailable: 'Mark All Seasons as Available',
  markallseasons4kavailable: 'Mark All Seasons as Available in 4K',
  opentautulli: 'Open Watch History in Tautulli',
  opentautulli4k: 'Open 4K Watch History in Tautulli',
  users:
    '<strong>{userCount, number} {userCount, plural, one {user} other {users}}</strong> {userCount, plural, one {has} other {have}} played this {mediaType} <strong>{playCount, number} {playCount, plural, one {time} other {times}}</strong>:',
  users4k:
    '<strong>{userCount, number} {userCount, plural, one {user} other {users}}</strong> {userCount, plural, one {has} other {have}} played this {mediaType} in 4K <strong>{playCount, number} {playCount, plural, one {time} other {times}}</strong>:',
  movie: 'movie',
  tvshow: 'series',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

interface ManageSlideOverProps {
  // mediaType: 'movie' | 'tv';
  show?: boolean;
  onClose: () => void;
  revalidate: () => void;
}

interface ManageSlideOverMovieProps extends ManageSlideOverProps {
  mediaType: 'movie';
  data: MovieDetails;
}

interface ManageSlideOverTvProps extends ManageSlideOverProps {
  mediaType: 'tv';
  data: TvDetails;
}

const ManageSlideOver: React.FC<
  ManageSlideOverMovieProps | ManageSlideOverTvProps
> = ({ show, mediaType, onClose, data, revalidate }) => {
  const { user: currentUser, hasPermission } = useUser();
  const intl = useIntl();
  const settings = useSettings();
  const { data: watchData } = useSWR<MediaWatchDataResponse>(
    data.mediaInfo && hasPermission(Permission.ADMIN)
      ? `/api/v1/media/${data.mediaInfo.id}/watch_data`
      : null
  );

  const deleteMedia = async () => {
    if (data.mediaInfo) {
      await axios.delete(`/api/v1/media/${data.mediaInfo.id}`);
      revalidate();
    }
  };

  const markAvailable = async (is4k = false) => {
    if (data.mediaInfo) {
      await axios.post(`/api/v1/media/${data.mediaInfo?.id}/available`, {
        is4k,
      });
      revalidate();
    }
  };

  const requests =
    data.mediaInfo?.requests?.filter(
      (request) => request.status !== MediaRequestStatus.DECLINED
    ) ?? [];

  const openIssues =
    data.mediaInfo?.issues?.filter(
      (issue) => issue.status === IssueStatus.OPEN
    ) ?? [];

  return (
    <SlideOver
      show={show}
      title={intl.formatMessage(messages.manageModalTitle, {
        mediaType: intl.formatMessage(
          mediaType === 'movie' ? globalMessages.movie : globalMessages.tvshow
        ),
      })}
      onClose={() => onClose()}
      subText={isMovie(data) ? data.title : data.name}
    >
      <div className="space-y-8">
        {((data?.mediaInfo?.downloadStatus ?? []).length > 0 ||
          (data?.mediaInfo?.downloadStatus4k ?? []).length > 0) && (
          <div>
            <h3 className="mb-2 text-xl font-bold">
              {intl.formatMessage(messages.downloadstatus)}
            </h3>
            <div className="overflow-hidden bg-gray-600 rounded-md shadow">
              <ul>
                {data.mediaInfo?.downloadStatus?.map((status, index) => (
                  <li
                    key={`dl-status-${status.externalId}-${index}`}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <DownloadBlock downloadItem={status} />
                  </li>
                ))}
                {data.mediaInfo?.downloadStatus4k?.map((status, index) => (
                  <li
                    key={`dl-status-${status.externalId}-${index}`}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <DownloadBlock downloadItem={status} is4k />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {hasPermission([Permission.MANAGE_ISSUES, Permission.VIEW_ISSUES], {
          type: 'or',
        }) &&
          openIssues.length > 0 && (
            <>
              <h3 className="mb-2 text-xl font-bold">
                {intl.formatMessage(messages.manageModalIssues)}
              </h3>
              <div className="overflow-hidden bg-gray-600 rounded-md shadow">
                <ul>
                  {openIssues.map((issue) => (
                    <li
                      key={`manage-issue-${issue.id}`}
                      className="border-b border-gray-700 last:border-b-0"
                    >
                      <IssueBlock issue={issue} />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        {requests.length > 0 && (
          <div>
            <h3 className="mb-2 text-xl font-bold">
              {intl.formatMessage(messages.manageModalRequests)}
            </h3>
            <div className="overflow-hidden bg-gray-600 rounded-md shadow">
              <ul>
                {requests.map((request) => (
                  <li
                    key={`manage-request-${request.id}`}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <RequestBlock
                      request={request}
                      onUpdate={() => revalidate()}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {hasPermission(Permission.ADMIN) &&
          (data.mediaInfo?.serviceUrl ||
            data.mediaInfo?.serviceUrl4k ||
            (watchData?.data?.playCount && watchData.data.users.length) ||
            (watchData?.data4k?.playCount &&
              watchData.data4k.users.length)) && (
            <div>
              <h3 className="mb-2 text-xl font-bold">
                {intl.formatMessage(messages.manageModalMedia)}
              </h3>
              <div className="space-y-2">
                {!!watchData?.data?.playCount &&
                  !!watchData?.data?.users?.length && (
                    <div>
                      <div
                        className={`p-4 space-y-1 overflow-hidden text-sm text-gray-300 bg-gray-600 shadow ${
                          data.mediaInfo?.tautulliUrl
                            ? 'rounded-t-md'
                            : 'rounded-md'
                        }`}
                      >
                        <div>
                          {intl.formatMessage(messages.users, {
                            userCount: watchData.data.users.length,
                            playCount: watchData.data.playCount,
                            mediaType: intl.formatMessage(
                              mediaType === 'movie'
                                ? messages.movie
                                : messages.tvshow
                            ),
                            strong: function strong(msg) {
                              return <strong>{msg}</strong>;
                            },
                          })}
                        </div>
                        <div className="inline-flex">
                          {watchData.data.users.map((user) => (
                            <Link
                              href={
                                currentUser?.id === user.id
                                  ? '/profile'
                                  : `/users/${user.id}`
                              }
                              key={`watch-user-${user.id}`}
                            >
                              <a>
                                <img
                                  src={user.avatar}
                                  alt={user.displayName}
                                  className="w-8 h-8 mr-1 transition duration-300 scale-100 rounded-full ring-1 ring-gray-500 transform-gpu hover:scale-105"
                                />
                              </a>
                            </Link>
                          ))}
                        </div>
                      </div>
                      {data.mediaInfo?.tautulliUrl && (
                        <a
                          href={data.mediaInfo.tautulliUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button
                            buttonType="ghost"
                            className="w-full rounded-t-none"
                          >
                            <ViewListIcon />
                            <span>
                              {intl.formatMessage(messages.opentautulli)}
                            </span>
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                {data?.mediaInfo?.serviceUrl && (
                  <a
                    href={data?.mediaInfo?.serviceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Button buttonType="ghost" className="w-full">
                      <ServerIcon />
                      <span>
                        {intl.formatMessage(messages.openarr, {
                          arr: mediaType === 'movie' ? 'Radarr' : 'Sonarr',
                        })}
                      </span>
                    </Button>
                  </a>
                )}
                {!!watchData?.data4k?.playCount &&
                  !!watchData?.data4k?.users.length && (
                    <div>
                      <div
                        className={`p-4 space-y-1 overflow-hidden text-sm text-gray-300 bg-gray-600 shadow ${
                          data.mediaInfo?.tautulliUrl
                            ? 'rounded-t-md'
                            : 'rounded-md'
                        }`}
                      >
                        <div>
                          {intl.formatMessage(messages.users, {
                            userCount: watchData.data4k.users.length,
                            playCount: watchData.data4k.playCount,
                            mediaType: intl.formatMessage(
                              mediaType === 'movie'
                                ? messages.movie
                                : messages.tvshow
                            ),
                            strong: function strong(msg) {
                              return <strong>{msg}</strong>;
                            },
                          })}
                        </div>
                        <div className="inline-flex">
                          {watchData.data4k.users.map((user) => (
                            <Link
                              href={
                                currentUser?.id === user.id
                                  ? '/profile'
                                  : `/users/${user.id}`
                              }
                              key={`watch-user-${user.id}`}
                            >
                              <a>
                                <img
                                  src={user.avatar}
                                  alt={user.displayName}
                                  className="w-8 h-8 mr-1 transition duration-300 scale-100 rounded-full ring-1 ring-gray-500 transform-gpu hover:scale-105"
                                />
                              </a>
                            </Link>
                          ))}
                        </div>
                      </div>
                      {data.mediaInfo?.tautulliUrl4k && (
                        <a
                          href={data.mediaInfo.tautulliUrl4k}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button
                            buttonType="ghost"
                            className="w-full rounded-t-none"
                          >
                            <ViewListIcon />
                            <span>
                              {intl.formatMessage(messages.opentautulli4k)}
                            </span>
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                {data?.mediaInfo?.serviceUrl4k && (
                  <a
                    href={data?.mediaInfo?.serviceUrl4k}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button buttonType="ghost" className="w-full">
                      <ServerIcon />
                      <span>
                        {intl.formatMessage(messages.openarr4k, {
                          arr: mediaType === 'movie' ? 'Radarr' : 'Sonarr',
                        })}
                      </span>
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        {hasPermission(Permission.ADMIN) && data?.mediaInfo && (
          <div>
            <h3 className="mb-2 text-xl font-bold">
              {intl.formatMessage(messages.manageModalAdvanced)}
            </h3>
            <div className="space-y-2">
              {data?.mediaInfo.status !== MediaStatus.AVAILABLE && (
                <Button
                  onClick={() => markAvailable()}
                  className="w-full"
                  buttonType="success"
                >
                  <CheckCircleIcon />
                  <span>
                    {intl.formatMessage(
                      mediaType === 'movie'
                        ? messages.markavailable
                        : messages.markallseasonsavailable
                    )}
                  </span>
                </Button>
              )}
              {data?.mediaInfo.status4k !== MediaStatus.AVAILABLE &&
                settings.currentSettings.series4kEnabled && (
                  <Button
                    onClick={() => markAvailable(true)}
                    className="w-full"
                    buttonType="success"
                  >
                    <CheckCircleIcon />
                    <span>
                      {intl.formatMessage(
                        mediaType === 'movie'
                          ? messages.mark4kavailable
                          : messages.markallseasons4kavailable
                      )}
                    </span>
                  </Button>
                )}
              <div>
                <ConfirmButton
                  onClick={() => deleteMedia()}
                  confirmText={intl.formatMessage(globalMessages.areyousure)}
                  className="w-full"
                >
                  <DocumentRemoveIcon />
                  <span>
                    {intl.formatMessage(messages.manageModalClearMedia)}
                  </span>
                </ConfirmButton>
                <div className="mt-1 text-xs text-gray-400">
                  {intl.formatMessage(messages.manageModalClearMediaWarning, {
                    mediaType: intl.formatMessage(
                      mediaType === 'movie' ? messages.movie : messages.tvshow
                    ),
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SlideOver>
  );
};

export default ManageSlideOver;
