import { ServerIcon } from '@heroicons/react/outline';
import {
  CheckCircleIcon,
  DocumentRemoveIcon,
  EyeIcon,
} from '@heroicons/react/solid';
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
import { MediaWatchHistoryResponse } from '../../../server/interfaces/api/mediaInterfaces';
import { MovieDetails } from '../../../server/models/Movie';
import { TvDetails } from '../../../server/models/Tv';
import useSettings from '../../hooks/useSettings';
import { Permission, User, useUser } from '../../hooks/useUser';
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
  users: '{userCount, number} {userCount, plural, one {user} other {users}}',
  otherusers:
    '{userCount, number} other {userCount, plural, one {user} other {users}}',
  usernames:
    '{nameCount, plural, one {{firstUser}} =2 {{firstUser} and {secondUser}} other {{firstUser}, {secondUser}, and {thirdUser}}}',
  usernameswithcount:
    '{nameCount, plural, one {{firstUser}} =2 {{firstUser}, {secondUser},} other {{firstUser}, {secondUser}, {thirdUser},}} and {otherUsers}',
  playdata:
    '{users} {userCount, plural, one {has} other {have}} played this {mediaType} {playCount, number} {playCount, plural, one {time} other {times}} (total duration of approximately {playDuration})',
  playdata4k:
    '{users} {userCount, plural, one {has} other {have}} played this {mediaType} in 4K {playCount, number} {playCount, plural, one {time} other {times}} (total duration of approximately {playDuration})',
  // Recreated here for lowercase versions to go with the modal clear media warning
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
  const { data: watchHistory } = useSWR<MediaWatchHistoryResponse>(
    data.mediaInfo ? `/api/v1/media/${data.mediaInfo.id}/watch_history` : null
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

  function userLink(user: User): JSX.Element {
    return (
      <Link
        href={user.id === currentUser?.id ? '/profile' : `/users/${user.id}`}
      >
        <a className="font-semibold text-gray-100 transition duration-300 hover:text-white hover:underline">
          {user.displayName}
        </a>
      </Link>
    );
  }

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
            (watchHistory?.data?.playCount && watchHistory.data.userCount) ||
            (watchHistory?.data4k?.playCount &&
              watchHistory.data4k.userCount)) && (
            <div>
              <h3 className="mb-2 text-xl font-bold">
                {intl.formatMessage(messages.manageModalMedia)}
              </h3>
              <div className="space-y-2">
                {!!watchHistory?.data?.playCount &&
                  !!watchHistory.data.userCount && (
                    <div className="space-y-1">
                      <div className="flex flex-row items-center justify-between p-4 overflow-hidden text-sm text-gray-400 bg-gray-600 rounded-md shadow">
                        <div className="my-auto">
                          {intl.formatMessage(messages.playdata, {
                            users:
                              watchHistory.data.users.length === 0
                                ? intl.formatMessage(messages.users, {
                                    userCount: watchHistory.data.userCount,
                                  })
                                : intl.formatMessage(
                                    watchHistory.data.userCount >
                                      Math.min(
                                        3,
                                        watchHistory.data.users.length
                                      )
                                      ? messages.usernameswithcount
                                      : messages.usernames,
                                    {
                                      nameCount: Math.min(
                                        3,
                                        watchHistory.data.users.length
                                      ),
                                      firstUser: watchHistory.data.users[0]
                                        ? userLink(watchHistory.data.users[0])
                                        : null,
                                      secondUser: watchHistory.data.users[1]
                                        ? userLink(watchHistory.data.users[1])
                                        : null,
                                      thirdUser: watchHistory.data.users[2]
                                        ? userLink(watchHistory.data.users[2])
                                        : null,
                                      otherUsers: intl.formatMessage(
                                        messages.otherusers,
                                        {
                                          userCount:
                                            watchHistory.data.userCount -
                                            Math.min(
                                              3,
                                              watchHistory.data.users.length
                                            ),
                                        }
                                      ),
                                    }
                                  ),
                            userCount: watchHistory.data.userCount,
                            playCount: watchHistory.data.playCount,
                            playDuration: watchHistory.data.playDuration,
                            mediaType: intl.formatMessage(
                              mediaType === 'movie'
                                ? messages.movie
                                : messages.tvshow
                            ),
                          })}
                        </div>
                        <div className="flex flex-wrap flex-shrink-0 ml-2">
                          <a
                            href={data.mediaInfo?.tautulliUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <Button buttonType="primary" as="a">
                              <EyeIcon />
                            </Button>
                          </a>
                        </div>
                      </div>
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
                {!!watchHistory?.data4k?.playCount &&
                  !!watchHistory.data4k.userCount && (
                    <div className="space-y-1">
                      <div className="flex flex-row items-center justify-between p-4 overflow-hidden text-sm text-gray-400 bg-gray-600 rounded-md shadow">
                        <div className="my-auto">
                          {intl.formatMessage(messages.playdata, {
                            users:
                              watchHistory.data4k.users.length === 0
                                ? intl.formatMessage(messages.users, {
                                    userCount: watchHistory.data4k.userCount,
                                  })
                                : intl.formatMessage(
                                    watchHistory.data4k.userCount >
                                      Math.min(
                                        3,
                                        watchHistory.data4k.users.length
                                      )
                                      ? messages.usernameswithcount
                                      : messages.usernames,
                                    {
                                      nameCount: Math.min(
                                        3,
                                        watchHistory.data4k.users.length
                                      ),
                                      firstUser: watchHistory.data4k.users[0]
                                        ? userLink(watchHistory.data4k.users[0])
                                        : null,
                                      secondUser: watchHistory.data4k.users[1]
                                        ? userLink(watchHistory.data4k.users[1])
                                        : null,
                                      thirdUser: watchHistory.data4k.users[2]
                                        ? userLink(watchHistory.data4k.users[2])
                                        : null,
                                      otherUsers: intl.formatMessage(
                                        messages.otherusers,
                                        {
                                          userCount:
                                            watchHistory.data4k.userCount -
                                            Math.min(
                                              3,
                                              watchHistory.data4k.users.length
                                            ),
                                        }
                                      ),
                                    }
                                  ),
                            userCount: watchHistory.data4k.userCount,
                            playCount: watchHistory.data4k.playCount,
                            playDuration: watchHistory.data4k.playDuration,
                            mediaType: intl.formatMessage(
                              mediaType === 'movie'
                                ? messages.movie
                                : messages.tvshow
                            ),
                          })}
                        </div>
                        <div className="flex flex-wrap flex-shrink-0 ml-2">
                          <a
                            href={data.mediaInfo?.tautulliUrl4k}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <Button buttonType="primary" as="a">
                              <EyeIcon />
                            </Button>
                          </a>
                        </div>
                      </div>
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
