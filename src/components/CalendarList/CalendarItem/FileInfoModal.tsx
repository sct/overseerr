import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Modal from '@app/components/Common/Modal';
import Tag from '@app/components/Common/Tag';
import { Permission, useUser } from '@app/hooks/useUser';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  LanguageIcon,
  LinkIcon,
  PlayCircleIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { MediaType } from '@server/constants/media';
import type { DownloadingItem } from '@server/lib/downloadtracker';
import axios from 'axios';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages({
  fileInfoTitle: 'File Information',
  deleteFile: 'Delete File',
  confirmDelete: 'Are you sure you want to delete this file?',
  filePath: 'File Path',
  fileSize: 'File Size',
  quality: 'Quality',
  resolution: 'Resolution',
  codec: 'Codec',
  container: 'Container',
  duration: 'Duration',
  bitrate: 'Bitrate',
  aspectRatio: 'Aspect Ratio',
  frameRate: 'Frame Rate',
  audioChannels: 'Audio Channels',
  audioCodec: 'Audio Codec',
  languages: 'Languages',
  subtitles: 'Subtitles',
  noFileInfo: 'No file information available',
  deleteSuccess: '<strong>{title}</strong> deleted successfully!',
  deleteError: 'Error deleting file',
  close: 'Close',
  videoDetailsTitle: 'Video Details',
  audioDetailsTitle: 'Audio Details',
  subtitlesTitle: 'Subtitles',
  fileDetailsTitle: 'File Details',
  dateAdded: 'Date Added',
  releaseGroup: 'Release Group',
  sonarrId: 'Sonarr ID',
  radarrId: 'Radarr ID',
  tmdbId: 'TMDB ID',
  addedBy: 'Requested By',
  tags: 'Tags',
  requestDate: 'Request Date',
  importSource: 'Import Source',
  importedName: 'Import Name',
  importedPath: 'Imported Path',
  libraryPath: 'Library Path',
  customFormatScore: 'Custom Format Score',
  season: 'Season',
  episode: 'Episode',
});

interface FileInfo {
  id: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  lastWriteTime?: string;
  sceneName?: string;
  releaseGroup?: string;
  quality: {
    quality: {
      id: number;
      name: string;
      source: string;
      resolution: number;
    };
    revision: {
      version: number;
      real: number;
      isRepack: boolean;
    };
  };
  mediaInfo?: {
    containerFormat?: string;
    videoCodec?: string;
    videoProfile?: string;
    videoBitrate?: number;
    videoBitDepth?: number;
    videoMultiViewCount?: number;
    videoColourPrimaries?: string;
    videoTransferCharacteristics?: string;
    resolution?: string;
    audioCodec?: string;
    audioProfile?: string;
    audioAdditionalFeatures?: string;
    audioBitrate?: number;
    runTime?: string;
    audioStreamCount?: number;
    audioChannels?: number;
    audioChannelPositions?: string;
    videoFps?: number;
    audioLanguages?: string;
    subtitles?: string;
    scanType?: string;
    schemaRevision?: number;
    videoDynamicRange?: string;
    videoDynamicRangeType?: string;
  };
  // Episode-specific fields
  seriesId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  // Movie-specific fields
  movieId?: number;
  // History-derived fields
  sourceName?: string;
  sourcePath?: string;
  libraryPath?: string;
  customFormatScore?: string;
  addedBy?: string;
  requestDate?: string;
  tags?: number[] | string[];
  // IDs for external links
  tvdbId?: number;
  imdbId?: string;
  tvRageId?: number;
  tvMazeId?: number;
  youTubeTrailerId?: string;
  // Service info for direct links
  serviceUrl?: string;
  serviceId?: number;
  titleSlug?: string;
  // Download progress for processing items
  downloadProgress?: {
    status: string;
    timeLeft: string;
    estimatedCompletionTime: Date;
    size: number;
    sizeLeft: number;
    isProcessing: boolean;
  };
}

interface FileInfoModalProps {
  itemId: number;
  source: 'radarr' | 'sonarr';
  mediaType: MediaType;
  tmdbId?: number;
  serviceId?: number;
  serviceName?: string;
  onClose: () => void;
  onFileDeleted?: () => void;
  itemTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  downloadStatus?: DownloadingItem[];
  isProcessing?: boolean;
}

const FileInfoModal = ({
  itemId,
  source,
  mediaType,
  tmdbId,
  serviceId,
  serviceName,
  onClose,
  onFileDeleted,
  itemTitle,
  seasonNumber,
  episodeNumber,
  downloadStatus,
  isProcessing,
}: FileInfoModalProps) => {
  const intl = useIntl();
  const { hasPermission } = useUser();

  // Check for calendar permissions - MANAGE_CALENDAR should grant access to all calendar features
  const hasViewDetails = hasPermission(
    [Permission.VIEW_CALENDAR_DETAILS, Permission.MANAGE_CALENDAR],
    { type: 'or' }
  );
  const hasDeleteFiles = hasPermission(
    [Permission.DELETE_CALENDAR_FILES, Permission.MANAGE_CALENDAR],
    { type: 'or' }
  );
  const { addToast } = useToasts();
  const [selectedBlocklistOption, setSelectedBlocklistOption] = useState(
    'blocklist_and_search'
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  // Fetch file info from the appropriate API - Always fetch for both processing and available items
  const shouldFetchFileInfo = true;
  const { data: fileInfo, error } = useSWR<FileInfo>(
    shouldFetchFileInfo
      ? `/api/v1/calendar/fileinfo?source=${source}&itemId=${itemId}${
          serviceId !== undefined && serviceId !== null
            ? `&serviceId=${serviceId}`
            : ''
        }${tmdbId ? `&tmdbId=${tmdbId}` : ''}`
      : null,
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onError: () => {
        // Error handled by SWR error state
      },
      onSuccess: () => {
        // Success handled by SWR data state
      },
    }
  );

  // Fetch TMDB data for backdrop image
  const tmdbUrl =
    tmdbId && mediaType === MediaType.MOVIE
      ? `/api/v1/movie/${tmdbId}`
      : tmdbId && mediaType === MediaType.TV
      ? `/api/v1/tv/${tmdbId}`
      : null;

  const { data: tmdbData } = useSWR(tmdbUrl);

  // Fetch season data to get episode overview
  const seasonUrl =
    tmdbId && mediaType === MediaType.TV && seasonNumber !== undefined
      ? `/api/v1/tv/${tmdbId}/season/${seasonNumber}`
      : null;

  const { data: seasonData } = useSWR(seasonUrl);

  // Find the specific episode from season data
  const episodeData = seasonData?.episodes?.find(
    (ep: { episodeNumber: number }) => ep.episodeNumber === episodeNumber
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getImportSource = (): string => {
    const serviceType = source.charAt(0).toUpperCase() + source.slice(1);
    // Users with VIEW_CALENDAR_DETAILS permission see the format "CustomServerName(ServiceType)"
    if (hasViewDetails && serviceName && serviceName.trim().length > 0) {
      return `${serviceName}(${serviceType})`;
    }
    return serviceType;
  };

  const getButtonText = (): string => {
    switch (selectedBlocklistOption) {
      case 'blocklist_and_search':
        return 'Blocklist and Search';
      case 'blocklist_only':
        return 'Blocklist Only';
      case 'do_not_blocklist':
        return 'Do Not Blocklist';
      default:
        return 'Blocklist and Search';
    }
  };

  const handleEnhancedDeleteFile = async (blocklistOption: string) => {
    if (!fileInfo) return;

    // Optimistic UI update: immediately remove from UI and close modal
    if (onFileDeleted) {
      onFileDeleted();
    }
    onClose();

    try {
      await axios.delete(`/api/v1/calendar/fileinfo`, {
        data: {
          source,
          fileId: fileInfo.id,
          itemId: itemId,
          serviceId: serviceId,
          // Enhanced options
          removalMethod: 'remove_from_client',
          blocklistOption: blocklistOption,
        },
      });

      addToast(<span>File removed successfully.</span>, {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch (error) {
      addToast('Failed to remove file from download client', {
        appearance: 'error',
      });
      // Note: We don't revert the UI change as the item may have been processed by Sonarr anyway
    }
  };

  const handleSimpleDeleteFile = async () => {
    if (!fileInfo) return;

    // Optimistic UI update: immediately remove from UI and close modal
    if (onFileDeleted) {
      onFileDeleted();
    }
    onClose();

    try {
      await axios.delete(`/api/v1/calendar/fileinfo`, {
        data: {
          source,
          fileId: fileInfo.id,
          itemId: itemId,
          serviceId: serviceId,
        },
      });

      addToast(<span>File deleted successfully.</span>, {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch (error) {
      addToast('Failed to delete file', { appearance: 'error' });
      // Note: We don't revert the UI change as the operation may have succeeded
    }
  };

  const isFileInQueue = () => {
    return (
      downloadStatus?.some(
        (download) =>
          download.trackedDownloadState === 'importPending' ||
          download.status === 'completed'
      ) || false
    );
  };

  if ((error || (!fileInfo && !error)) && !isProcessing) {
    return (
      <Transition
        as={undefined}
        show={true}
        enter="transition-opacity ease-in-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in-out duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Modal
          onCancel={onClose}
          title={intl.formatMessage(messages.fileInfoTitle)}
          cancelText={intl.formatMessage(messages.close)}
        >
          {error ? (
            <div className="py-6 text-gray-300">
              <div className="text-center">
                {intl.formatMessage(messages.noFileInfo)}
              </div>
              {/* Show small diagnostic details to help identify the issue */}
              <div className="mt-3 break-all rounded bg-gray-800 p-3 text-xs text-indigo-300">
                <div className="font-medium text-gray-300">Error details</div>
                <div>
                  <span className="text-indigo-300">URL:</span>{' '}
                  <code className="text-gray-300">
                    {`/api/v1/calendar/fileinfo?source=${source}&itemId=${itemId}${
                      serviceId !== undefined && serviceId !== null
                        ? `&serviceId=${serviceId}`
                        : ''
                    }${tmdbId ? `&tmdbId=${tmdbId}` : ''}`}
                  </code>
                </div>
                <div>
                  <span className="text-indigo-300">Status:</span>{' '}
                  {(error as unknown as { response?: { status?: number } })
                    ?.response?.status ?? 'n/a'}
                </div>
                <div>
                  <span className="text-indigo-300">Message:</span>{' '}
                  {(
                    error as unknown as {
                      response?: { data?: { message?: string } };
                      message?: string;
                    }
                  )?.response?.data?.message ??
                    (error as unknown as { message?: string })?.message ??
                    'unknown'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
        </Modal>
      </Transition>
    );
  }

  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={true}
    >
      <div>
        <Modal
          backgroundClickable
          onCancel={onClose}
          title={intl.formatMessage(messages.fileInfoTitle)}
          subTitle={
            tmdbData && (tmdbData.title || tmdbData.name)
              ? tmdbData.title || tmdbData.name
              : 'Media File'
          }
          cancelText={intl.formatMessage(messages.close)}
          backdrop={
            tmdbData?.backdropPath
              ? `https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${tmdbData.backdropPath}`
              : undefined
          }
        >
          {/* Episode Title - Small subtitle for TV shows */}
          {source === 'sonarr' && itemTitle && (
            <div className="-mt-3">
              <div className="text-sm font-semibold text-indigo-300">
                {itemTitle}
              </div>
            </div>
          )}

          {/* Episode Overview - Centered below episode title */}
          {source === 'sonarr' && episodeData?.overview && (
            <div className="mt-0 text-center">
              <p className="mx-auto max-w-3xl text-sm leading-relaxed text-gray-300">
                {episodeData.overview.length > 400
                  ? `${episodeData.overview.slice(0, 400)}...`
                  : episodeData.overview}
              </p>
            </div>
          )}

          {/* Processing View - Matching File Details Layout */}
          {isProcessing && downloadStatus && downloadStatus.length > 0 ? (
            <div className="py-6">
              <div className="mb-6">
                <Alert
                  title={
                    <div className="flex items-center">
                      <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                      Downloading -{' '}
                      {downloadStatus[0]?.downloadClient || 'Unknown'}
                    </div>
                  }
                  type="info"
                  hideIcon={true}
                />
              </div>

              <div className="rounded-lg bg-gradient-to-b from-gray-800/5 via-gray-800/40 to-gray-800 p-4">
                <div className="space-y-4 text-sm">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-300">Progress</span>
                      <span className="text-white">
                        {downloadStatus[0]?.size &&
                        downloadStatus[0]?.sizeLeft !== undefined ? (
                          <>
                            {(
                              (downloadStatus[0].size -
                                downloadStatus[0].sizeLeft) /
                              (1024 * 1024 * 1024)
                            ).toFixed(2)}{' '}
                            GB /{' '}
                            {(
                              downloadStatus[0].size /
                              (1024 * 1024 * 1024)
                            ).toFixed(2)}{' '}
                            GB
                          </>
                        ) : (
                          'Processing...'
                        )}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-green-600 transition-all duration-300"
                        style={{
                          width: `${
                            downloadStatus[0]?.size &&
                            downloadStatus[0]?.sizeLeft !== undefined
                              ? Math.round(
                                  ((downloadStatus[0].size -
                                    downloadStatus[0].sizeLeft) /
                                    downloadStatus[0].size) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="text-center text-xs text-indigo-200">
                      {downloadStatus[0]?.size &&
                      downloadStatus[0]?.sizeLeft !== undefined
                        ? `${Math.round(
                            ((downloadStatus[0].size -
                              downloadStatus[0].sizeLeft) /
                              downloadStatus[0].size) *
                              100
                          )}%`
                        : '0%'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-6">
                {/* Video Details Section */}
                {fileInfo?.mediaInfo && (
                  <div className="rounded-lg p-4">
                    <div className="-mx-4 -mt-4 mb-3">
                      <Alert
                        title={
                          <div className="flex items-center">
                            <PlayCircleIcon className="mr-2 h-5 w-5" />
                            Video Details
                          </div>
                        }
                        type="info"
                        hideIcon={true}
                      />
                    </div>

                    <div className="rounded-lg bg-gradient-to-b from-gray-800/5 via-gray-800/40 to-gray-800 p-4">
                      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div className="flex justify-between">
                          <span className="text-indigo-300">Container</span>
                          <span className="text-white">
                            {fileInfo.mediaInfo.containerFormat?.toUpperCase() ||
                              (fileInfo.path
                                ? fileInfo.path.split('.').pop()?.toUpperCase()
                                : 'Unknown')}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-indigo-300">Codec</span>
                          <span className="text-white">
                            {fileInfo.mediaInfo.videoCodec?.toUpperCase() ||
                              'Unknown'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-indigo-300">Width</span>
                          <span className="text-white">
                            {fileInfo.mediaInfo.resolution
                              ? fileInfo.mediaInfo.resolution.split('x')[0] +
                                'px'
                              : 'Unknown'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-indigo-300">Height</span>
                          <span className="text-white">
                            {fileInfo.mediaInfo.resolution
                              ? fileInfo.mediaInfo.resolution.split('x')[1] +
                                'px'
                              : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Details */}
                {fileInfo?.mediaInfo && (
                  <div className="rounded-lg p-4">
                    <div className="-mx-4 -mt-4 mb-3">
                      <Alert
                        title={
                          <div className="flex w-full items-center">
                            <SpeakerWaveIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                            <span className="flex-shrink-0">Audio Details</span>
                            <div className="flex-1"></div>
                            {fileInfo.mediaInfo.audioStreamCount &&
                              fileInfo.mediaInfo.audioStreamCount > 1 && (
                                <div className="group relative flex-shrink-0">
                                  <InformationCircleIcon className="h-5 w-5 cursor-help text-gray-100" />
                                  <div className="pointer-events-none absolute right-0 top-6 z-50 w-80 rounded-md border border-gray-600 bg-gray-900 p-3 text-xs text-gray-300 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                                    <p className="mb-2 font-medium text-white">
                                      Multiple Audio Streams:{' '}
                                      {fileInfo.mediaInfo.audioStreamCount}{' '}
                                      tracks found.
                                    </p>
                                    <p>
                                      The details displayed represent the
                                      primary audio stream.{' '}
                                      {source === 'sonarr'
                                        ? 'Sonarr'
                                        : 'Radarr'}{' '}
                                      API doesn&apos;t send additional audio
                                      stream data which may include commentary,
                                      alternate languages, or enhanced audio
                                      formats.
                                    </p>
                                  </div>
                                </div>
                              )}
                          </div>
                        }
                        type="info"
                        hideIcon={true}
                      />
                    </div>

                    <div className="rounded-lg bg-gray-800 p-4">
                      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div className="flex justify-between">
                          <span className="text-indigo-300">Codec</span>
                          <span className="text-white">
                            {fileInfo.mediaInfo.audioCodec?.toUpperCase() ||
                              'Unknown'}
                          </span>
                        </div>

                        {fileInfo.mediaInfo.audioBitrate !== undefined &&
                          fileInfo.mediaInfo.audioBitrate !== null &&
                          (fileInfo.mediaInfo.audioBitrate > 0 ? (
                            <div className="flex justify-between">
                              <span className="text-indigo-300">Bitrate</span>
                              <span className="text-white">
                                {fileInfo.mediaInfo.audioBitrate} kbps
                              </span>
                            </div>
                          ) : fileInfo.mediaInfo.audioCodec?.toUpperCase() ===
                            'AAC' ? (
                            <div className="flex justify-between">
                              <span className="text-indigo-300">Bitrate</span>
                              <span className="text-white">VBR</span>
                            </div>
                          ) : null)}

                        {fileInfo.mediaInfo.audioChannels && (
                          <div className="flex justify-between">
                            <span className="text-indigo-300">Channels</span>
                            <span className="text-white">
                              {fileInfo.mediaInfo.audioChannels}
                            </span>
                          </div>
                        )}

                        {fileInfo.mediaInfo.audioLanguages && (
                          <div className="flex justify-between">
                            <span className="text-indigo-300">
                              Language
                              {fileInfo.mediaInfo.audioStreamCount &&
                              fileInfo.mediaInfo.audioStreamCount > 1
                                ? 's'
                                : ''}
                            </span>
                            <span className="text-white">
                              {fileInfo.mediaInfo.audioLanguages}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtitles */}
                {fileInfo?.mediaInfo && (
                  <div className="rounded-lg p-4">
                    <div className="-mx-4 -mt-4 mb-3">
                      <Alert
                        title={
                          <div className="flex items-center">
                            <LanguageIcon className="mr-2 h-5 w-5" />
                            Subtitle Details
                          </div>
                        }
                        type="info"
                        hideIcon={true}
                      />
                    </div>

                    <div className="rounded-lg bg-gray-800 p-4">
                      <div className="text-sm">
                        <span className="break-words text-white">
                          {fileInfo.mediaInfo.subtitles || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Status Banner */}
                {fileInfo?.downloadProgress?.isProcessing && (
                  <div className="rounded-lg p-4">
                    <div className="-mx-4 -mt-4 mb-3">
                      <Alert
                        title={
                          <div className="flex items-center">
                            <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                            {fileInfo.downloadProgress.status.includes(
                              'Waiting to Import'
                            ) ||
                            fileInfo.downloadProgress.status === 'completed'
                              ? 'Waiting to Import'
                              : 'Downloading'}
                          </div>
                        }
                        type={
                          fileInfo.downloadProgress.status.includes(
                            'Waiting to Import'
                          ) || fileInfo.downloadProgress.status === 'completed'
                            ? 'info'
                            : 'warning'
                        }
                        hideIcon={true}
                      />
                    </div>
                  </div>
                )}

                {/* File Details */}
                {fileInfo && !fileInfo?.downloadProgress?.isProcessing && (
                  <div className="rounded-lg p-4">
                    <div className="-mx-4 -mt-4 mb-3">
                      <Alert
                        title={
                          <div className="flex items-center">
                            <DocumentTextIcon className="mr-2 h-5 w-5" />
                            File Details
                          </div>
                        }
                        type="info"
                        hideIcon={true}
                      />
                    </div>

                    <div className="rounded-lg bg-gray-800 p-4">
                      <div className="space-y-3 text-sm">
                        {/* File Size and Date Added - visible to everyone */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex justify-between">
                            <span className="text-indigo-300">File Size</span>
                            <span className="text-white">
                              {formatFileSize(fileInfo.size)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-indigo-300">Date Added</span>
                            <span className="text-white">
                              {formatDate(
                                fileInfo.lastWriteTime || fileInfo.dateAdded
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Season and Episode - visible to everyone */}
                        {(seasonNumber !== undefined ||
                          episodeNumber !== undefined) && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {seasonNumber !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-indigo-300">
                                  {intl.formatMessage(messages.season)}
                                </span>
                                <span className="text-white">
                                  {seasonNumber}
                                </span>
                              </div>
                            )}

                            {episodeNumber !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-indigo-300">
                                  {intl.formatMessage(messages.episode)}
                                </span>
                                <span className="text-white">
                                  {episodeNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Release Group and Quality - VIEW_CALENDAR_DETAILS permission required */}
                        {hasViewDetails && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {fileInfo.releaseGroup && (
                              <div className="flex justify-between">
                                <span className="text-indigo-300">
                                  {intl.formatMessage(messages.releaseGroup)}
                                </span>
                                <span className="text-white">
                                  {fileInfo.releaseGroup}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span className="text-indigo-300">
                                {intl.formatMessage(messages.quality)}
                              </span>
                              <span className="text-white">
                                {fileInfo.quality?.quality?.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Service IDs and TMDB ID - VIEW_CALENDAR_DETAILS permission required */}
                        {hasViewDetails && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex justify-between">
                              <span className="text-indigo-300">
                                {source === 'sonarr'
                                  ? intl.formatMessage(messages.sonarrId)
                                  : intl.formatMessage(messages.radarrId)}
                              </span>
                              <span className="text-white">{itemId}</span>
                            </div>

                            {tmdbId && (
                              <div className="flex justify-between">
                                <span className="text-indigo-300">
                                  {intl.formatMessage(messages.tmdbId)}
                                </span>
                                <span className="text-white">{tmdbId}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Request Date and Added By - VIEW_CALENDAR_DETAILS permission required */}
                        {hasViewDetails && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex items-center justify-between">
                              <span className="text-indigo-300">
                                {intl.formatMessage(messages.requestDate)}
                              </span>
                              <span className="text-white">
                                {fileInfo.requestDate
                                  ? formatDate(fileInfo.requestDate)
                                  : 'N/A'}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-indigo-300">
                                {intl.formatMessage(messages.addedBy)}
                              </span>
                              <span className="text-white">
                                {fileInfo.addedBy || 'N/A'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Tags - VIEW_CALENDAR_DETAILS permission required */}
                        {hasViewDetails && (
                          <div className="space-y-2">
                            <span className="text-indigo-300">
                              {intl.formatMessage(messages.tags)}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {fileInfo.tags && fileInfo.tags.length > 0 ? (
                                Array.isArray(fileInfo.tags) ? (
                                  fileInfo.tags.map((tag, index) => (
                                    <Tag key={index}>{tag}</Tag>
                                  ))
                                ) : (
                                  <Tag>{fileInfo.tags}</Tag>
                                )
                              ) : (
                                <span className="text-sm text-white">N/A</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Import Source - VIEW_CALENDAR_DETAILS permission required */}
                        {hasViewDetails && (
                          <div>
                            <span className="mb-1 block text-indigo-300">
                              {intl.formatMessage(messages.importSource)}
                            </span>
                            <div className="break-all rounded bg-gray-900 p-2 font-mono text-xs text-gray-100">
                              {getImportSource()}
                            </div>
                          </div>
                        )}

                        {/* Import Name - VIEW_CALENDAR_DETAILS permission required */}
                        {hasPermission(Permission.VIEW_CALENDAR_DETAILS) &&
                          fileInfo.sourceName && (
                            <div>
                              <span className="mb-1 block text-indigo-300">
                                {intl.formatMessage(messages.importedName)}
                              </span>
                              <div className="break-all rounded bg-gray-900 p-2 font-mono text-xs text-gray-100">
                                {fileInfo.sourceName}
                              </div>
                            </div>
                          )}

                        {/* Imported Path - VIEW_CALENDAR_DETAILS permission required */}
                        {hasPermission(Permission.VIEW_CALENDAR_DETAILS) &&
                          fileInfo.sourcePath && (
                            <div>
                              <span className="mb-1 block text-indigo-300">
                                {intl.formatMessage(messages.importedPath)}
                              </span>
                              <div className="break-all rounded bg-gray-900 p-2 font-mono text-xs text-gray-100">
                                {fileInfo.sourcePath}
                              </div>
                            </div>
                          )}

                        {/* Custom Format Score - VIEW_CALENDAR_DETAILS permission required */}
                        {hasPermission(Permission.VIEW_CALENDAR_DETAILS) &&
                          fileInfo.customFormatScore && (
                            <div>
                              <span className="mb-1 block text-indigo-300">
                                {intl.formatMessage(messages.customFormatScore)}
                              </span>
                              <div className="break-all rounded bg-gray-900 p-2 font-mono text-xs text-gray-100">
                                {fileInfo.customFormatScore}
                              </div>
                            </div>
                          )}

                        {/* Library Path - VIEW_CALENDAR_DETAILS permission required */}
                        {hasViewDetails && (
                          <div>
                            <span className="mb-1 block text-indigo-300">
                              {intl.formatMessage(messages.libraryPath)}
                            </span>
                            <div className="break-all rounded bg-gray-900 p-2 font-mono text-xs text-gray-100">
                              {fileInfo.path}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Links - VIEW_CALENDAR_DETAILS permission required */}
                {hasViewDetails &&
                  !fileInfo?.downloadProgress?.isProcessing && (
                    <div className="rounded-lg p-4">
                      <div className="-mx-4 -mt-4 mb-3">
                        <Alert
                          title={
                            <div className="flex items-center">
                              <LinkIcon className="mr-2 h-5 w-5" />
                              Links
                            </div>
                          }
                          type="info"
                          hideIcon={true}
                        />
                      </div>

                      <div className="rounded-lg bg-gray-800 p-4">
                        <div className="flex flex-wrap gap-2">
                          {/* Sonarr/Radarr service pill */}
                          {tmdbId && (
                            <a
                              href={`/${
                                source === 'sonarr' ? 'tv' : 'movie'
                              }/${tmdbId}`}
                              className="inline-flex items-center rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/30 transition-colors hover:bg-blue-500/30"
                            >
                              {source === 'sonarr' ? 'Sonarr' : 'Radarr'}
                            </a>
                          )}

                          {/* TMDB link */}
                          {tmdbId && (
                            <a
                              href={`https://www.themoviedb.org/${
                                mediaType === MediaType.MOVIE ? 'movie' : 'tv'
                              }/${tmdbId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/30 transition-colors hover:bg-green-500/30"
                            >
                              TMDB
                            </a>
                          )}

                          {/* TVDB link (TV shows only) */}
                          {fileInfo?.tvdbId && source === 'sonarr' && (
                            <a
                              href={`https://thetvdb.com/dereferrer/series/${fileInfo.tvdbId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-400 ring-1 ring-inset ring-cyan-500/30 transition-colors hover:bg-cyan-500/30"
                            >
                              TVDB
                            </a>
                          )}

                          {/* IMDb link */}
                          {fileInfo?.imdbId && (
                            <a
                              href={`https://www.imdb.com/title/${fileInfo.imdbId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/30 transition-colors hover:bg-yellow-500/30"
                            >
                              IMDb
                            </a>
                          )}

                          {/* TVMaze link (TV shows only) */}
                          {fileInfo?.tvMazeId && source === 'sonarr' && (
                            <a
                              href={`https://www.tvmaze.com/shows/${fileInfo.tvMazeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/30 transition-colors hover:bg-red-500/30"
                            >
                              TVMaze
                            </a>
                          )}

                          {/* Trakt link */}
                          {((tmdbId && source === 'radarr') ||
                            (fileInfo?.tvdbId && source === 'sonarr')) && (
                            <a
                              href={
                                source === 'radarr'
                                  ? `https://trakt.tv/search/tmdb/${tmdbId}?id_type=movie`
                                  : `https://trakt.tv/search/tvdb/${fileInfo?.tvdbId}?id_type=show`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/30 transition-colors hover:bg-purple-500/30"
                            >
                              Trakt
                            </a>
                          )}

                          {/* Letterboxd (Movies only) */}
                          {tmdbId && source === 'radarr' && (
                            <a
                              href={`https://letterboxd.com/tmdb/${tmdbId}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-400 ring-1 ring-inset ring-orange-500/30 transition-colors hover:bg-orange-500/30"
                            >
                              Letterboxd
                            </a>
                          )}

                          {/* Movie Chat (Movies only) - Using IMDb ID */}
                          {fileInfo?.imdbId && source === 'radarr' && (
                            <a
                              href={`https://moviechat.org/${fileInfo.imdbId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-pink-500/20 px-2 py-1 text-xs font-medium text-pink-400 ring-1 ring-inset ring-pink-500/30 transition-colors hover:bg-pink-500/30"
                            >
                              Movie Chat
                            </a>
                          )}

                          {/* MDBList link */}
                          {((tmdbId && source === 'radarr') ||
                            (fileInfo?.tvdbId && source === 'sonarr')) && (
                            <a
                              href={
                                source === 'radarr'
                                  ? `https://mdblist.com/movie/${tmdbId}`
                                  : `https://mdblist.com/tv/${fileInfo?.tvdbId}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/30 transition-colors hover:bg-indigo-500/30"
                            >
                              MDBList
                            </a>
                          )}

                          {/* Blu-ray.com (Movies only) - Using title search */}
                          {tmdbId && source === 'radarr' && (
                            <a
                              href={`https://www.blu-ray.com/search/?quicksearch=1&quicksearch_keyword=${encodeURIComponent(
                                itemTitle || ''
                              )}&section=theatrical`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-slate-500/20 px-2 py-1 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-500/30 transition-colors hover:bg-slate-500/30"
                            >
                              Blu-ray
                            </a>
                          )}

                          {/* YouTube Trailer (Movies only) */}
                          {fileInfo?.youTubeTrailerId &&
                            source === 'radarr' && (
                              <a
                                href={`https://www.youtube.com/watch?v=${fileInfo.youTubeTrailerId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-md bg-red-600/20 px-2 py-1 text-xs font-medium text-red-300 ring-1 ring-inset ring-red-600/30 transition-colors hover:bg-red-600/30"
                              >
                                Trailer
                              </a>
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Delete File Section - Danger Zone - Show for completed downloads and available files */}
                {hasDeleteFiles &&
                  fileInfo &&
                  (fileInfo.downloadProgress?.status.includes(
                    'Waiting to Import'
                  ) ||
                    fileInfo.downloadProgress?.status === 'completed' ||
                    (!fileInfo.downloadProgress && fileInfo.path)) && ( // Available files with no active download
                    <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-4">
                      <h3 className="mb-2 flex items-center text-lg font-semibold text-red-400">
                        <TrashIcon className="mr-2 h-5 w-5" />
                        Danger Zone
                      </h3>

                      {/* Show dropdown for files in queue/processing */}
                      {isFileInQueue() ? (
                        <>
                          <p className="mb-4 text-sm text-gray-300">
                            Remove this file from the queue. Choose your
                            preferred blocklist option.
                          </p>

                          <div className="space-y-3">
                            <Menu as="div" className="relative w-full">
                              <div className="flex">
                                <Button
                                  buttonType="danger"
                                  onClick={() =>
                                    handleEnhancedDeleteFile(
                                      selectedBlocklistOption
                                    )
                                  }
                                  className="flex-1 rounded-r-none border-r-0"
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  {getButtonText()}
                                </Button>
                                <Menu.Button className="inline-flex items-center rounded-r-md border border-red-600 bg-red-600 px-2 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                  <ChevronDownIcon className="h-4 w-4" />
                                </Menu.Button>
                              </div>

                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute bottom-full left-0 z-10 mb-1 w-full origin-bottom-left divide-y divide-gray-700 rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            setSelectedBlocklistOption(
                                              'blocklist_and_search'
                                            )
                                          }
                                          className={`${
                                            active
                                              ? 'bg-gray-700 text-white'
                                              : 'text-gray-200'
                                          } ${
                                            selectedBlocklistOption ===
                                            'blocklist_and_search'
                                              ? 'bg-indigo-700 text-white'
                                              : ''
                                          } group flex w-full items-center px-4 py-2 text-left text-sm`}
                                        >
                                          <TrashIcon className="mr-2 h-4 w-4 text-red-400" />
                                          Blocklist and Search
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            setSelectedBlocklistOption(
                                              'blocklist_only'
                                            )
                                          }
                                          className={`${
                                            active
                                              ? 'bg-gray-700 text-white'
                                              : 'text-gray-200'
                                          } ${
                                            selectedBlocklistOption ===
                                            'blocklist_only'
                                              ? 'bg-indigo-700 text-white'
                                              : ''
                                          } group flex w-full items-center px-4 py-2 text-left text-sm`}
                                        >
                                          <TrashIcon className="mr-2 h-4 w-4 text-red-400" />
                                          Blocklist Only
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            setSelectedBlocklistOption(
                                              'do_not_blocklist'
                                            )
                                          }
                                          className={`${
                                            active
                                              ? 'bg-gray-700 text-white'
                                              : 'text-gray-200'
                                          } ${
                                            selectedBlocklistOption ===
                                            'do_not_blocklist'
                                              ? 'bg-indigo-700 text-white'
                                              : ''
                                          } group flex w-full items-center px-4 py-2 text-left text-sm`}
                                        >
                                          <TrashIcon className="mr-2 h-4 w-4 text-red-400" />
                                          Do Not Blocklist
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </>
                      ) : (
                        /* Show simple confirmation button for available files */
                        <>
                          <p className="mb-4 text-sm text-gray-300">
                            Permanently delete this file from your system. This
                            action cannot be undone.
                          </p>

                          <div className="space-y-3">
                            <Button
                              buttonType="danger"
                              onClick={() =>
                                showConfirmDelete
                                  ? handleSimpleDeleteFile()
                                  : setShowConfirmDelete(true)
                              }
                              className="w-full"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              {showConfirmDelete
                                ? 'Are you sure?'
                                : 'Remove File'}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
              </div>
            </>
          )}
        </Modal>
      </div>
    </Transition>
  );
};

export default FileInfoModal;
