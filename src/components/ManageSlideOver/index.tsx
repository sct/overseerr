import {
  CheckCircleIcon,
  DocumentRemoveIcon,
  ExternalLinkIcon,
} from '@heroicons/react/solid';
import axios from 'axios';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { IssueStatus } from '../../../server/constants/issue';
import { MediaStatus } from '../../../server/constants/media';
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
  manageModalRequests: 'Requests',
  manageModalNoRequests: 'No requests.',
  manageModalClearMedia: 'Clear Media Data',
  manageModalClearMediaWarning:
    '* This will irreversibly remove all data for this {mediaType}, including any requests. If this item exists in your Plex library, the media information will be recreated during the next scan.',
  openarr: 'Open {mediaType} in {arr}',
  openarr4k: 'Open {mediaType} in 4K {arr}',
  downloadstatus: 'Download Status',
  markavailable: 'Mark as Available',
  mark4kavailable: 'Mark as Available in 4K',
  allseasonsmarkedavailable: '* All seasons will be marked as available.',
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
  const { hasPermission } = useUser();
  const intl = useIntl();
  const settings = useSettings();

  const deleteMedia = async () => {
    if (data?.mediaInfo?.id) {
      await axios.delete(`/api/v1/media/${data?.mediaInfo?.id}`);
      revalidate();
    }
  };

  const markAvailable = async (is4k = false) => {
    await axios.post(`/api/v1/media/${data?.mediaInfo?.id}/available`, {
      is4k,
    });
    revalidate();
  };

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
      {((data?.mediaInfo?.downloadStatus ?? []).length > 0 ||
        (data?.mediaInfo?.downloadStatus4k ?? []).length > 0) && (
        <>
          <h3 className="mb-2 text-xl">
            {intl.formatMessage(messages.downloadstatus)}
          </h3>
          <div className="mb-6 overflow-hidden bg-gray-600 rounded-md shadow">
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
        </>
      )}
      {data?.mediaInfo &&
        (data.mediaInfo.status !== MediaStatus.AVAILABLE ||
          (data.mediaInfo.status4k !== MediaStatus.AVAILABLE &&
            settings.currentSettings.series4kEnabled)) && (
          <div className="mb-6">
            {data?.mediaInfo &&
              data?.mediaInfo.status !== MediaStatus.AVAILABLE && (
                <div className="flex flex-col mb-2 sm:flex-row flex-nowrap">
                  <Button
                    onClick={() => markAvailable()}
                    className="w-full sm:mb-0"
                    buttonType="success"
                  >
                    <CheckCircleIcon />
                    <span>{intl.formatMessage(messages.markavailable)}</span>
                  </Button>
                </div>
              )}
            {data?.mediaInfo &&
              data?.mediaInfo.status4k !== MediaStatus.AVAILABLE &&
              settings.currentSettings.series4kEnabled && (
                <div className="flex flex-col mb-2 sm:flex-row flex-nowrap">
                  <Button
                    onClick={() => markAvailable(true)}
                    className="w-full sm:mb-0"
                    buttonType="success"
                  >
                    <CheckCircleIcon />
                    <span>{intl.formatMessage(messages.mark4kavailable)}</span>
                  </Button>
                </div>
              )}
            {mediaType === 'tv' && (
              <div className="mt-3 text-xs text-gray-400">
                {intl.formatMessage(messages.allseasonsmarkedavailable)}
              </div>
            )}
          </div>
        )}
      {(data.mediaInfo?.issues ?? []).length > 0 && (
        <>
          <h3 className="mb-2 text-xl">Open Issues</h3>
          <div className="mb-4 overflow-hidden bg-gray-600 rounded-md shadow">
            <ul>
              {data.mediaInfo?.issues
                ?.filter((issue) => issue.status === IssueStatus.OPEN)
                .map((issue) => (
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
      <h3 className="mb-2 text-xl">
        {intl.formatMessage(messages.manageModalRequests)}
      </h3>
      <div className="overflow-hidden bg-gray-600 rounded-md shadow">
        <ul>
          {data.mediaInfo?.requests?.map((request) => (
            <li
              key={`manage-request-${request.id}`}
              className="border-b border-gray-700 last:border-b-0"
            >
              <RequestBlock request={request} onUpdate={() => revalidate()} />
            </li>
          ))}
          {(data.mediaInfo?.requests ?? []).length === 0 && (
            <li className="py-4 text-center text-gray-400">
              {intl.formatMessage(messages.manageModalNoRequests)}
            </li>
          )}
        </ul>
      </div>
      {hasPermission(Permission.ADMIN) &&
        (data?.mediaInfo?.serviceUrl || data?.mediaInfo?.serviceUrl4k) && (
          <div className="mt-8">
            {data?.mediaInfo?.serviceUrl && (
              <a
                href={data?.mediaInfo?.serviceUrl}
                target="_blank"
                rel="noreferrer"
                className="block mb-2 last:mb-0"
              >
                <Button buttonType="ghost" className="w-full">
                  <ExternalLinkIcon />
                  <span>
                    {intl.formatMessage(messages.openarr, {
                      mediaType: intl.formatMessage(
                        mediaType === 'movie'
                          ? globalMessages.movie
                          : globalMessages.tvshow
                      ),
                      arr: mediaType === 'movie' ? 'Radarr' : 'Sonarr',
                    })}
                  </span>
                </Button>
              </a>
            )}
            {data?.mediaInfo?.serviceUrl4k && (
              <a
                href={data?.mediaInfo?.serviceUrl4k}
                target="_blank"
                rel="noreferrer"
              >
                <Button buttonType="ghost" className="w-full">
                  <ExternalLinkIcon />
                  <span>
                    {intl.formatMessage(messages.openarr4k, {
                      mediaType: intl.formatMessage(
                        mediaType === 'movie'
                          ? globalMessages.movie
                          : globalMessages.tvshow
                      ),
                      arr: mediaType === 'movie' ? 'Radarr' : 'Sonarr',
                    })}
                  </span>
                </Button>
              </a>
            )}
          </div>
        )}
      {data?.mediaInfo && (
        <div className="mt-8">
          <ConfirmButton
            onClick={() => deleteMedia()}
            confirmText={intl.formatMessage(globalMessages.areyousure)}
            className="w-full"
          >
            <DocumentRemoveIcon />
            <span>{intl.formatMessage(messages.manageModalClearMedia)}</span>
          </ConfirmButton>
          <div className="mt-3 text-xs text-gray-400">
            {intl.formatMessage(messages.manageModalClearMediaWarning, {
              mediaType: intl.formatMessage(
                mediaType === 'movie' ? messages.movie : messages.tvshow
              ),
            })}
          </div>
        </div>
      )}
    </SlideOver>
  );
};

export default ManageSlideOver;
