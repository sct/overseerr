import RadarrAPI from '@server/api/servarr/radarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import TheMovieDb from '@server/api/themoviedb';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { MediaRequest } from '@server/entity/MediaRequest';
import { User } from '@server/entity/User';
import type { DownloadingItem } from '@server/lib/downloadtracker';
import downloadTracker from '@server/lib/downloadtracker';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

export interface CalendarItem {
  id: number;
  title: string;
  seriesTitle?: string;
  overview?: string;
  airDate?: string;
  airDateUtc?: string;
  releaseDate?: string;
  mediaType: MediaType;
  tmdbId?: number;
  tvdbId?: number;
  seriesId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  hasFile: boolean;
  monitored: boolean;
  images?: {
    coverType: string;
    url: string;
  }[];
  tags?: number[];
  source: 'sonarr' | 'radarr';
  serviceId?: number;
  serviceName?: string;
  downloadStatus?: DownloadingItem[];
}

export interface CalendarResponse {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: CalendarItem[];
}

const calendarRoutes = Router();

/**
 * Validates if an air date is complete and reliable
 * @param airDate The air date string to validate
 * @returns true if the date is valid and complete, false otherwise
 */
function isValidAirDate(airDate: string | null | undefined): boolean {
  if (!airDate) return false;

  // Check if it's a valid date
  const date = new Date(airDate);
  if (isNaN(date.getTime())) return false;

  // Reject time-only strings (e.g., "8:00pm", "20:00")
  if (airDate.match(/^\d{1,2}:\d{2}(:\d{2})?\s?(AM|PM|am|pm)?$/)) return false;

  // Accept full ISO dates (2025-08-13), ISO timestamps (2025-08-13T00:00:00Z),
  // and other valid date formats that aren't just time strings
  return true;
}

calendarRoutes.get<Record<string, unknown>, CalendarResponse>(
  '/',
  async (req, res, next) => {
    try {
      const settings = getSettings();
      const pageSize = req.query.take ? Number(req.query.take) : 20;
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const start = req.query.start as string;
      const end = req.query.end as string;
      const filter = req.query.filter as string;
      const requestedBy = req.query.requestedBy
        ? Number(req.query.requestedBy)
        : null;
      const sonarrId = req.query.sonarrId
        ? Number(req.query.sonarrId)
        : undefined;
      const radarrId = req.query.radarrId
        ? Number(req.query.radarrId)
        : undefined;

      if (!start || !end) {
        return next({
          status: 400,
          message: 'Start and end parameters are required',
        });
      }

      let results: CalendarItem[] = [];
      let tagFilter: string[] = [];

      // Handle "My Shows" filter with user tagging
      if (filter === 'my_items' && req.user?.id) {
        const userTag = `${req.user.id} - ${req.user.displayName}`;
        tagFilter = [userTag];
      } else if (requestedBy && req.user?.id) {
        // Support filtering by specific user
        const userRepository = getRepository(User);
        const targetUser = await userRepository.findOne({
          where: { id: requestedBy },
        });
        if (targetUser) {
          const userTag = `${targetUser.id} - ${targetUser.displayName}`;
          tagFilter = [userTag];
        }
      }

      // Fetch Sonarr calendar data
      if (settings.sonarr.length > 0) {
        try {
          const sonarrSettings = settings.sonarr.find((s) =>
            sonarrId !== undefined ? s.id === sonarrId : s.isDefault
          );

          if (sonarrSettings) {
            logger.info('Fetching Sonarr calendar data', {
              label: 'Calendar API',
              url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
              serverId: sonarrSettings.id,
              serverName: sonarrSettings.name,
            });

            const sonarr = new SonarrAPI({
              apiKey: sonarrSettings.apiKey,
              url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
            });

            // Add timeout to prevent hanging
            const sonarrPromise = sonarr.getCalendar(
              start,
              end,
              tagFilter.length > 0 ? { tags: tagFilter } : undefined
            );

            const sonarrData = (await Promise.race([
              sonarrPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Sonarr API timeout')), 10000)
              ),
            ])) as any;

            // Fetch series data for each episode to get tmdbId (parallel requests for performance)
            const seriesIds = [
              ...new Set(sonarrData.map((ep: any) => ep.seriesId)),
            ];
            const seriesDataMap = new Map();

            // Make parallel requests for better performance
            const seriesPromises = seriesIds.map(async (seriesId) => {
              try {
                const series = await sonarr.getSeriesById(Number(seriesId));
                return { seriesId, series };
              } catch (error) {
                logger.warn(
                  `Failed to fetch series data for seriesId ${seriesId}`,
                  {
                    label: 'Calendar API',
                    error: error.message,
                  }
                );
                return { seriesId, series: null };
              }
            });

            const seriesResults = await Promise.all(seriesPromises);
            seriesResults.forEach(({ seriesId, series }) => {
              if (series) {
                seriesDataMap.set(seriesId, series);
              }
            });

            // Initialize TMDB API for fallback lookups
            const tmdb = new TheMovieDb();
            let tmdbFallbackCount = 0;
            let invalidDateCount = 0;

            const sonarrItems: CalendarItem[] = [];

            for (const episode of sonarrData) {
              const series = seriesDataMap.get(episode.seriesId);
              let finalAirDate = episode.airDate;
              let finalAirDateUtc = episode.airDateUtc;

              // Check if Sonarr air date is valid
              if (!isValidAirDate(episode.airDate)) {
                invalidDateCount++;

                // Try TMDB fallback if series has tmdbId
                if (series?.tmdbId) {
                  try {
                    const tmdbSeason = await tmdb.getTvSeason({
                      tvId: series.tmdbId,
                      seasonNumber: episode.seasonNumber,
                    });

                    const tmdbEpisode = tmdbSeason.episodes?.find(
                      (ep: any) => ep.episode_number === episode.episodeNumber
                    );

                    if (tmdbEpisode?.air_date) {
                      // Convert TMDB date to full timestamp
                      finalAirDate = `${tmdbEpisode.air_date}T00:00:00Z`;
                      finalAirDateUtc = finalAirDate;
                      tmdbFallbackCount++;

                      logger.debug('Used TMDB fallback for episode air date', {
                        label: 'Calendar API',
                        seriesTitle: series.title,
                        seasonNumber: episode.seasonNumber,
                        episodeNumber: episode.episodeNumber,
                        originalDate: episode.airDate,
                        tmdbDate: finalAirDate,
                      });
                    }
                  } catch (tmdbError) {
                    logger.warn('TMDB episode lookup failed', {
                      label: 'Calendar API',
                      seriesId: episode.seriesId,
                      seasonNumber: episode.seasonNumber,
                      episodeNumber: episode.episodeNumber,
                      errorMessage: tmdbError.message,
                    });
                  }
                }

                // Skip episode if still no valid date after TMDB fallback
                if (!isValidAirDate(finalAirDate)) {
                  logger.debug('Skipping episode with invalid air date', {
                    label: 'Calendar API',
                    seriesTitle: series?.title,
                    episodeTitle: episode.title,
                    seasonNumber: episode.seasonNumber,
                    episodeNumber: episode.episodeNumber,
                    originalDate: episode.airDate,
                  });
                  continue;
                }
              }

              sonarrItems.push({
                id: episode.id,
                title: episode.title,
                seriesTitle: series?.title,
                overview: episode.overview,
                airDate: finalAirDate,
                airDateUtc: finalAirDateUtc,
                mediaType: MediaType.TV,
                tmdbId: series?.tmdbId,
                tvdbId: series?.tvdbId,
                seriesId: episode.seriesId,
                seasonNumber: episode.seasonNumber,
                episodeNumber: episode.episodeNumber,
                hasFile: episode.hasFile,
                monitored: episode.monitored,
                source: 'sonarr',
                serviceId: sonarrSettings.id,
                serviceName: sonarrSettings.name,
              });
            }

            results = results.concat(sonarrItems);
            logger.info('Sonarr calendar data processed', {
              label: 'Calendar API',
              totalEpisodes: sonarrData.length,
              validEpisodes: sonarrItems.length,
              invalidDates: invalidDateCount,
              tmdbFallbacks: tmdbFallbackCount,
              filteredOut: sonarrData.length - sonarrItems.length,
            });
          }
        } catch (error) {
          logger.error('Failed to fetch Sonarr calendar data', {
            label: 'Calendar API',
            errorMessage: error.message,
          });
        }
      } else {
        logger.info('No Sonarr servers configured', { label: 'Calendar API' });
      }

      // Fetch Radarr calendar data
      if (settings.radarr.length > 0) {
        try {
          const radarrSettings = settings.radarr.find((r) =>
            radarrId !== undefined ? r.id === radarrId : r.isDefault
          );
          if (radarrSettings) {
            logger.info('Fetching Radarr calendar data', {
              label: 'Calendar API',
              url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
              serverId: radarrSettings.id,
              serverName: radarrSettings.name,
            });

            const radarr = new RadarrAPI({
              apiKey: radarrSettings.apiKey,
              url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
            });

            // Add timeout to prevent hanging
            const radarrPromise = radarr.getCalendar(
              start,
              end,
              tagFilter.length > 0 ? { tags: tagFilter } : undefined
            );

            const radarrData = (await Promise.race([
              radarrPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Radarr API timeout')), 10000)
              ),
            ])) as any;

            const radarrItems: CalendarItem[] = radarrData.map((movie: any) => {
              const radarrItem = {
                id: movie.id,
                title: movie.title,
                mediaType: MediaType.MOVIE,
                tmdbId: movie.tmdbId,
                hasFile: movie.hasFile,
                monitored: movie.monitored,
                releaseDate: movie.hasFile
                  ? movie.movieFile?.dateAdded || movie.added
                  : movie.digitalRelease ||
                    movie.physicalRelease ||
                    movie.inCinemas ||
                    movie.added, // Prioritize digital release date
                tags: movie.tags,
                source: 'radarr',
                serviceId: radarrSettings.id,
                serviceName: radarrSettings.name,
              };

              logger.debug('Creating Radarr calendar item', {
                label: 'Calendar API',
                title: radarrItem.title,
                radarrId: movie.id,
                serviceId: radarrSettings.id,
                itemId: radarrItem.id,
                hasFile: radarrItem.hasFile,
                monitored: radarrItem.monitored,
              });

              return radarrItem;
            });

            results = results.concat(radarrItems);
            logger.info(
              `Retrieved ${radarrItems.length} Radarr calendar items`,
              {
                label: 'Calendar API',
              }
            );
          }
        } catch (error) {
          logger.error('Failed to fetch Radarr calendar data', {
            label: 'Calendar API',
            errorMessage: error.message,
          });
        }
      } else {
        logger.info('No Radarr servers configured', { label: 'Calendar API' });
      }

      // Apply additional filtering
      let filteredResults = results;

      switch (filter) {
        case 'airing_today': {
          const today = new Date().toISOString().split('T')[0];
          filteredResults = results.filter((item) => {
            const dateToCheck = item.airDate || item.releaseDate;
            return dateToCheck && dateToCheck.startsWith(today);
          });
          break;
        }
        case 'this_week': {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          filteredResults = results.filter((item) => {
            const dateToCheck = item.airDate || item.releaseDate;
            if (!dateToCheck) return false;

            const itemDate = new Date(dateToCheck);
            return (
              !isNaN(itemDate.getTime()) &&
              itemDate >= weekStart &&
              itemDate <= weekEnd
            );
          });
          break;
        }
        case 'downloaded':
          filteredResults = results.filter((item) => item.hasFile);
          break;
        case 'missing':
          filteredResults = results.filter(
            (item) => !item.hasFile && item.monitored
          );
          break;
        case 'processing':
          // Filter for items that have active downloads
          // This will be applied after download status is populated
          break;
        case 'upcoming': {
          const now = new Date();
          filteredResults = results.filter((item) => {
            const dateToCheck = item.airDate || item.releaseDate;
            if (!dateToCheck) return false;

            const itemDate = new Date(dateToCheck);
            return !isNaN(itemDate.getTime()) && itemDate > now;
          });
          break;
        }
        case 'movies':
          filteredResults = results.filter((item) => item.source === 'radarr');
          break;
        case 'series':
          filteredResults = results.filter((item) => item.source === 'sonarr');
          break;
      }

      // Sort by air date / release date
      filteredResults.sort((a, b) => {
        const aDateStr = a.airDate || a.releaseDate;
        const bDateStr = b.airDate || b.releaseDate;

        // Handle null/undefined dates by putting them at the end
        if (!aDateStr && !bDateStr) return 0;
        if (!aDateStr) return 1;
        if (!bDateStr) return -1;

        const aDate = new Date(aDateStr);
        const bDate = new Date(bDateStr);

        // Handle invalid dates
        if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
        if (isNaN(aDate.getTime())) return 1;
        if (isNaN(bDate.getTime())) return -1;

        return aDate.getTime() - bDate.getTime();
      });

      // Add download status to each calendar item (before pagination for processing filter)
      const resultsWithDownloadStatus = filteredResults.map((item) => {
        logger.info('Calendar item processing', {
          label: 'Calendar API',
          title: item.title,
          seriesTitle: item.seriesTitle,
          source: item.source,
          serviceId: item.serviceId,
          seriesId: item.seriesId,
          seasonNumber: item.seasonNumber,
          episodeNumber: item.episodeNumber,
          conditionMet: !!(
            (typeof item.serviceId === 'number' &&
              item.source === 'sonarr' &&
              item.seriesId) ||
            (typeof item.serviceId === 'number' &&
              item.source === 'radarr' &&
              item.id)
          ),
        });
        if (
          typeof item.serviceId === 'number' &&
          item.source === 'sonarr' &&
          item.seriesId
        ) {
          // For TV series, get download progress from Sonarr
          const allDownloads = downloadTracker.getSeriesProgress(
            item.serviceId,
            item.seriesId
          );

          // Filter downloads to only show downloads for this specific episode
          const downloadStatus =
            item.seasonNumber !== undefined && item.episodeNumber !== undefined
              ? allDownloads.filter((download) => {
                  const match =
                    download.episode?.seasonNumber === item.seasonNumber &&
                    download.episode?.episodeNumber === item.episodeNumber;
                  if (allDownloads.length > 0) {
                    logger.info('Download episode filtering', {
                      label: 'Calendar API',
                      itemTitle: item.title,
                      itemSeason: item.seasonNumber,
                      itemEpisode: item.episodeNumber,
                      downloadTitle: download.title,
                      downloadSeason: download.episode?.seasonNumber,
                      downloadEpisode: download.episode?.episodeNumber,
                      match: match,
                    });
                  }
                  return match;
                })
              : allDownloads; // Fallback to all downloads if episode info not available

          logger.info('Calendar download status lookup', {
            label: 'Calendar API',
            title: item.title,
            seriesTitle: item.seriesTitle,
            serviceId: item.serviceId,
            seriesId: item.seriesId,
            seasonNumber: item.seasonNumber,
            episodeNumber: item.episodeNumber,
            allDownloadsCount: allDownloads.length,
            filteredDownloadStatusCount: downloadStatus.length,
            hasDownloads: downloadStatus.length > 0,
          });
          item.downloadStatus = downloadStatus;
        } else if (
          typeof item.serviceId === 'number' &&
          item.source === 'radarr' &&
          item.id
        ) {
          // For movies, get download progress from Radarr
          const downloadStatus = downloadTracker.getMovieProgress(
            item.serviceId,
            item.id
          );

          logger.info('Calendar download status lookup', {
            label: 'Calendar API',
            title: item.title,
            serviceId: item.serviceId,
            movieId: item.id,
            downloadStatusCount: downloadStatus.length,
            hasDownloads: downloadStatus.length > 0,
          });

          item.downloadStatus = downloadStatus;
        }
        return item;
      });

      // Apply processing filter after download status is populated
      try {
        logger.info('Starting filter processing section', {
          label: 'Calendar API',
          filter: filter,
          isProcessing: filter === 'processing',
          totalResultsBeforeFilter: resultsWithDownloadStatus.length,
        });

        let finalResults = resultsWithDownloadStatus;
        if (filter === 'processing') {
          logger.info('Processing filter logic starting', {
            label: 'Calendar API',
            totalItems: resultsWithDownloadStatus.length,
          });

          const itemsWithDownloads = resultsWithDownloadStatus.filter(
            (item) => {
              const hasDownloads =
                item.downloadStatus && item.downloadStatus.length > 0;
              if (hasDownloads) {
                logger.info('Found item with downloads for processing filter', {
                  label: 'Calendar API',
                  title: item.title,
                  seriesTitle: item.seriesTitle,
                  downloadCount: item.downloadStatus?.length,
                });
              }
              return hasDownloads;
            }
          );

          logger.info('Processing filter results', {
            label: 'Calendar API',
            totalItems: resultsWithDownloadStatus.length,
            itemsWithDownloads: itemsWithDownloads.length,
          });

          finalResults = itemsWithDownloads;
        }

        // Apply pagination after processing filter
        logger.info('Applying pagination', {
          label: 'Calendar API',
          finalTotalResults: finalResults.length,
          skip: skip,
          pageSize: pageSize,
        });

        const finalTotalResults = finalResults.length;
        const paginatedResults = finalResults.slice(skip, skip + pageSize);

        logger.info('Sending successful response', {
          label: 'Calendar API',
          totalResults: finalTotalResults,
          paginatedResultsCount: paginatedResults.length,
        });

        return res.status(200).json({
          pageInfo: {
            pages: Math.ceil(finalTotalResults / pageSize),
            pageSize,
            results: finalTotalResults,
            page: Math.ceil(skip / pageSize) + 1,
          },
          results: paginatedResults,
        });
      } catch (filterError) {
        logger.error('Error in filter processing section', {
          label: 'Calendar API',
          errorMessage: filterError.message,
          errorStack: filterError.stack,
          filter: filter,
        });
        next({ status: 500, message: 'Failed to apply processing filter' });
        return;
      }
    } catch (error) {
      logger.error('Something went wrong retrieving calendar data', {
        label: 'Calendar API',
        errorMessage: error.message,
      });
      next({ status: 500, message: 'Unable to retrieve calendar data' });
    }
  }
);

calendarRoutes.get('/count', async (_req, res, next) => {
  try {
    const settings = getSettings();
    let totalEpisodes = 0;
    let totalMovies = 0;
    let totalDownloaded = 0;
    let totalMissing = 0;

    // Get counts from Sonarr
    if (settings.sonarr.length > 0) {
      try {
        const sonarrSettings = settings.sonarr.find((s) => s.isDefault);
        if (sonarrSettings) {
          const sonarr = new SonarrAPI({
            apiKey: sonarrSettings.apiKey,
            url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
          });

          const now = new Date();
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() + 7);

          const episodes = await sonarr.getCalendar(
            now.toISOString(),
            weekEnd.toISOString()
          );

          totalEpisodes = episodes.length;
          totalDownloaded += episodes.filter((e) => e.hasFile).length;
          totalMissing += episodes.filter(
            (e) => !e.hasFile && e.monitored
          ).length;
        }
      } catch (error) {
        logger.error('Failed to get Sonarr counts', {
          label: 'Calendar API',
          errorMessage: error.message,
        });
      }
    }

    // Get counts from Radarr
    if (settings.radarr.length > 0) {
      try {
        const radarrSettings = settings.radarr.find((r) => r.isDefault);
        if (radarrSettings) {
          const radarr = new RadarrAPI({
            apiKey: radarrSettings.apiKey,
            url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
          });

          const now = new Date();
          const monthEnd = new Date(now);
          monthEnd.setMonth(now.getMonth() + 1);

          const movies = await radarr.getCalendar(
            now.toISOString(),
            monthEnd.toISOString()
          );

          totalMovies = movies.length;
          totalDownloaded += movies.filter((m) => m.hasFile).length;
          totalMissing += movies.filter(
            (m) => !m.hasFile && m.monitored
          ).length;
        }
      } catch (error) {
        logger.error('Failed to get Radarr counts', {
          label: 'Calendar API',
          errorMessage: error.message,
        });
      }
    }

    return res.status(200).json({
      totalEpisodes,
      totalMovies,
      totalDownloaded,
      totalMissing,
      total: totalEpisodes + totalMovies,
    });
  } catch (error) {
    logger.error('Something went wrong retrieving calendar counts', {
      label: 'Calendar API',
      errorMessage: error.message,
    });
    next({ status: 500, message: 'Unable to retrieve calendar counts' });
  }
});

// File info routes for calendar items
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
    videoFormat?: string;
    videoCodecID?: string;
    videoProfile?: string;
    videoBitrate?: number;
    videoBitDepth?: number;
    videoMultiViewCount?: number;
    videoColourPrimaries?: string;
    videoTransferCharacteristics?: string;
    width?: number;
    height?: number;
    audioFormat?: string;
    audioCodecID?: string;
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
  dateFound?: string;
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

// Get file info for a calendar item
calendarRoutes.get('/fileinfo', async (req, res, next) => {
  try {
    const settings = getSettings();
    const { source, itemId, serviceId, tmdbId } = req.query as {
      source?: string;
      itemId?: string;
      serviceId?: string;
      tmdbId?: string;
    };
    logger.info('Incoming fileinfo request', {
      label: 'Calendar FileInfo API',
      source,
      itemId,
      serviceId,
      tmdbId,
    });

    if (!source || !itemId) {
      return next({
        status: 400,
        message: 'Source and itemId parameters are required',
      });
    }

    if (source !== 'radarr' && source !== 'sonarr') {
      return next({
        status: 400,
        message: 'Source must be either radarr or sonarr',
      });
    }

    let fileInfo: FileInfo | null = null;

    if (source === 'radarr') {
      // Get Radarr movie file info
      const hasServiceId =
        serviceId !== undefined && serviceId !== null && serviceId !== '';
      const radarrSettings = settings.radarr.find((r) =>
        hasServiceId ? r.id === Number(serviceId) : r.isDefault
      );
      if (!radarrSettings) {
        return next({
          status: 404,
          message: 'No Radarr server configured (by serviceId or default) ',
        });
      }

      const radarr = new RadarrAPI({
        apiKey: radarrSettings.apiKey,
        url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
      });

      try {
        // First try by Radarr's internal movie id
        let movie: any | null = null;
        try {
          movie = await radarr.getMovie({ id: Number(itemId) });
        } catch (e) {
          logger.warn(
            'Radarr getMovie by internal id failed; will try tmdbId if provided',
            {
              label: 'Calendar FileInfo API',
              errorMessage: e.message,
              movieId: itemId,
              tmdbId,
            }
          );
        }

        // If no movie or no file, fall back to TMDB lookup when available
        if ((!movie || !movie.hasFile || !movie.movieFile) && tmdbId) {
          try {
            const byTmdb = await radarr.getMovieByTmdbId(Number(tmdbId));
            if (byTmdb?.hasFile && byTmdb.movieFile?.id) {
              movie = byTmdb;
              logger.info('Resolved Radarr movie via tmdbId fallback', {
                label: 'Calendar FileInfo API',
                tmdbId,
                movieId: byTmdb.id,
              });
            }
          } catch (e) {
            logger.warn('Radarr tmdbId lookup failed', {
              label: 'Calendar FileInfo API',
              errorMessage: e.message,
              tmdbId,
            });
          }
        }

        if (!movie || (!movie.hasFile && !movie.monitored)) {
          return next({
            status: 404,
            message: 'Movie not found or not monitored',
          });
        }

        // Check if movie has a file or is currently downloading
        if (!movie.hasFile) {
          // Check download tracker for progress information
          const downloadStatus = downloadTracker.getMovieProgress(
            Number(serviceId) || 0,
            movie.id
          );

          if (downloadStatus.length === 0) {
            return next({
              status: 404,
              message: 'Movie file not found and no downloads in progress',
            });
          }

          // Return download progress information for processing items
          fileInfo = {
            id: movie.id,
            relativePath: downloadStatus[0].title || 'Processing...',
            size: downloadStatus[0].size || 0,
            path: 'Download in progress',
            language: { name: 'Unknown', id: 0 },
            languages: [{ name: 'Unknown', id: 0 }],
            quality: {
              quality: {
                name: 'Processing',
                id: 0,
                source: 'unknown',
                resolution: 0,
              },
              revision: { version: 1, real: 0, isRepack: false },
            },
            qualityCutoffNotMet: false,
            customFormats: [],
            customFormatScore: '0',
            releaseGroup: 'Processing',
            edition: '',
            dateAdded: new Date().toISOString(),
            indexerFlags: 0,
            originalFilePath: downloadStatus[0].title || 'Processing...',
            downloadProgress: {
              status: downloadStatus[0].status,
              timeLeft: downloadStatus[0].timeLeft,
              estimatedCompletionTime:
                downloadStatus[0].estimatedCompletionTime,
              size: downloadStatus[0].size,
              sizeLeft: downloadStatus[0].sizeLeft,
              isProcessing: true,
            },
          } as FileInfo;

          // Add IDs and slug for external service links
          if (movie.imdbId) fileInfo.imdbId = movie.imdbId;
          if (movie.titleSlug) fileInfo.titleSlug = movie.titleSlug;
          if (movie.youTubeTrailerId)
            fileInfo.youTubeTrailerId = movie.youTubeTrailerId;

          // Skip file-specific operations and return processing info
          return res.status(200).json(fileInfo);
        }

        // Get detailed file information
        const rawFileInfo = await radarr.getMovieFile(movie.movieFile.id);
        if (!rawFileInfo) {
          return next({
            status: 404,
            message: 'Movie file information not found',
          });
        }

        // Debug logging to see what we actually get from the API
        logger.info('Raw Radarr file info mediaInfo structure', {
          label: 'Calendar FileInfo API Debug',
          movieId: movie.id,
          mediaInfo: rawFileInfo.mediaInfo,
          mediaInfoKeys: rawFileInfo.mediaInfo
            ? Object.keys(rawFileInfo.mediaInfo)
            : null,
        });

        fileInfo = {
          ...rawFileInfo,
          mediaInfo: rawFileInfo.mediaInfo
            ? {
                ...rawFileInfo.mediaInfo,
                // Radarr API already provides the correct field names, no mapping needed
              }
            : undefined,
        } as FileInfo;

        // Add IDs and slug for external service links
        if (movie.imdbId) fileInfo.imdbId = movie.imdbId;
        if (movie.titleSlug) fileInfo.titleSlug = movie.titleSlug;
        if (movie.youTubeTrailerId)
          fileInfo.youTubeTrailerId = movie.youTubeTrailerId;

        // Resolve tag IDs to tag names and clean them
        if (movie.tags && movie.tags.length > 0) {
          try {
            const tagDefinitions = await radarr.getTags();
            const tagNames = movie.tags.map((tagId: number) => {
              const tag = tagDefinitions.find((t) => t.id === tagId);
              if (tag && tag.label) {
                // Remove ID prefix pattern (e.g., "1 - aolaim" -> "aolaim")
                return tag.label.replace(/^\d+\s*-\s*/, '');
              }
              return tagId.toString();
            });
            fileInfo.tags = tagNames;
          } catch (tagError) {
            logger.warn('Failed to fetch Radarr tag definitions', {
              label: 'Calendar FileInfo API',
              errorMessage: (tagError as any).message,
              movieId: movie.id,
            });
            fileInfo.tags = movie.tags; // Fallback to tag IDs
          }
        }

        // Get history data for additional file details
        try {
          const historyData = await radarr.getHistory(movie.id);
          const importRecord = historyData.records?.find(
            (record: any) =>
              record.eventType === 'downloadFolderImported' &&
              record.movieId === movie.id
          );

          if (importRecord) {
            fileInfo.sourceName = importRecord.sourceTitle;
            fileInfo.sourcePath =
              importRecord.data?.droppedPath || importRecord.data?.importedPath;
            fileInfo.libraryPath =
              importRecord.data?.importedPath || fileInfo.path;
            fileInfo.customFormatScore = importRecord.data?.customFormatScore;
            fileInfo.dateFound = importRecord.date;
          }
        } catch (historyError) {
          logger.warn('Failed to fetch Radarr history data', {
            label: 'Calendar FileInfo API',
            errorMessage: (historyError as any).message,
            movieId: movie.id,
          });
        }

        logger.info('Retrieved Radarr file info', {
          label: 'Calendar FileInfo API',
          movieId: movie.id,
          fileId: movie.movieFile?.id,
        });
      } catch (error) {
        logger.error('Failed to fetch Radarr file info', {
          label: 'Calendar FileInfo API',
          errorMessage: (error as any).message,
          movieId: itemId,
          tmdbId,
        });
        return next({
          status: 500,
          message: 'Failed to fetch file information from Radarr',
        });
      }
    } else {
      // Get Sonarr episode file info
      const hasServiceId =
        serviceId !== undefined && serviceId !== null && serviceId !== '';
      const sonarrSettings = settings.sonarr.find((s) =>
        hasServiceId ? s.id === Number(serviceId) : s.isDefault
      );
      if (!sonarrSettings) {
        return next({
          status: 404,
          message: 'No Sonarr server configured (by serviceId or default)',
        });
      }

      const sonarr = new SonarrAPI({
        apiKey: sonarrSettings.apiKey,
        url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
      });

      try {
        // Get episode information
        const episode = await sonarr.getEpisode(Number(itemId));

        if (!episode.hasFile && !episode.monitored) {
          return next({
            status: 404,
            message: 'Episode not found or not monitored',
          });
        }

        // Check if episode has a file or is currently downloading
        if (!episode.hasFile) {
          // Check download tracker for progress information
          const downloadStatus = downloadTracker.getSeriesProgress(
            Number(serviceId) || 0,
            episode.seriesId
          );

          // Filter downloads for this specific episode
          const episodeDownloads = downloadStatus.filter(
            (download) =>
              download.episode &&
              download.episode.seasonNumber === episode.seasonNumber &&
              download.episode.episodeNumber === episode.episodeNumber
          );

          if (episodeDownloads.length === 0) {
            return next({
              status: 404,
              message: 'Episode file not found and no downloads in progress',
            });
          }

          // Return download progress information for processing items
          const downloadItem = episodeDownloads[0];
          fileInfo = {
            id: episode.id,
            relativePath: downloadItem.title || 'Processing...',
            size: downloadItem.size || 0,
            path: 'Download in progress',
            language: { name: 'Unknown', id: 0 },
            languages: [{ name: 'Unknown', id: 0 }],
            quality: {
              quality: {
                name: 'Processing',
                id: 0,
                source: 'unknown',
                resolution: 0,
              },
              revision: { version: 1, real: 0, isRepack: false },
            },
            qualityCutoffNotMet: false,
            customFormats: [],
            customFormatScore: '0',
            releaseGroup: 'Processing',
            dateAdded: new Date().toISOString(),
            originalFilePath: downloadItem.title || 'Processing...',
            downloadProgress: {
              status: downloadItem.status,
              timeLeft: downloadItem.timeLeft,
              estimatedCompletionTime: downloadItem.estimatedCompletionTime,
              size: downloadItem.size,
              sizeLeft: downloadItem.sizeLeft,
              isProcessing: true,
            },
          } as FileInfo;

          // Add series ID for direct links
          fileInfo.seriesId = episode.seriesId;

          // Get series information for external IDs and titleSlug
          try {
            const series = await sonarr.getSeriesById(episode.seriesId);
            if (series.tvdbId) fileInfo.tvdbId = series.tvdbId;
            if (series.imdbId) fileInfo.imdbId = series.imdbId;
            if (series.tvRageId) fileInfo.tvRageId = series.tvRageId;
            if (series.tvMazeId) fileInfo.tvMazeId = series.tvMazeId;
            if (series.titleSlug) fileInfo.titleSlug = series.titleSlug;

            // Resolve tag IDs to tag names
            if (series.tags && series.tags.length > 0) {
              try {
                const tagDefinitions = await sonarr.getTags();
                const tagNames = series.tags.map((tagId: number) => {
                  const tag = tagDefinitions.find((t) => t.id === tagId);
                  return tag ? tag.label : `Tag-${tagId}`;
                });
                fileInfo.tags = tagNames;
              } catch (e) {
                logger.warn(
                  'Failed to resolve Sonarr tags for processing episode',
                  {
                    label: 'Calendar FileInfo API',
                    errorMessage: (e as any).message,
                    seriesId: episode.seriesId,
                  }
                );
              }
            }
          } catch (e) {
            logger.warn('Failed to get series info for processing episode', {
              label: 'Calendar FileInfo API',
              errorMessage: (e as any).message,
              seriesId: episode.seriesId,
            });
          }

          // Skip file-specific operations and return processing info
          return res.status(200).json(fileInfo);
        }

        // Get detailed file information
        const rawFileInfo = await sonarr.getEpisodeFile(episode.episodeFileId);
        if (!rawFileInfo) {
          return next({
            status: 404,
            message: 'Episode file information not found',
          });
        }

        // Debug logging to see what we actually get from the API
        logger.info('Raw Sonarr file info mediaInfo structure', {
          label: 'Calendar FileInfo API Debug',
          episodeId: episode.id,
          mediaInfo: rawFileInfo.mediaInfo,
          mediaInfoKeys: rawFileInfo.mediaInfo
            ? Object.keys(rawFileInfo.mediaInfo)
            : null,
        });

        fileInfo = {
          ...rawFileInfo,
          mediaInfo: rawFileInfo.mediaInfo
            ? {
                ...rawFileInfo.mediaInfo,
                // Sonarr API already provides the correct field names, no mapping needed
              }
            : undefined,
        } as FileInfo;

        // Add series ID for direct links
        fileInfo.seriesId = episode.seriesId;

        // Get series information for external IDs and titleSlug
        try {
          const series = await sonarr.getSeriesById(episode.seriesId);
          if (series.tvdbId) fileInfo.tvdbId = series.tvdbId;
          if (series.imdbId) fileInfo.imdbId = series.imdbId;
          if (series.tvRageId) fileInfo.tvRageId = series.tvRageId;
          if (series.tvMazeId) fileInfo.tvMazeId = series.tvMazeId;
          if (series.titleSlug) fileInfo.titleSlug = series.titleSlug;

          // Resolve tag IDs to tag names and clean them
          if (series.tags && series.tags.length > 0) {
            try {
              const tagDefinitions = await sonarr.getTags();
              const tagNames = series.tags.map((tagId: number) => {
                const tag = tagDefinitions.find((t) => t.id === tagId);
                if (tag && tag.label) {
                  // Remove ID prefix pattern (e.g., "1 - aolaim" -> "aolaim")
                  return tag.label.replace(/^\d+\s*-\s*/, '');
                }
                return tagId.toString();
              });
              fileInfo.tags = tagNames;
            } catch (tagError) {
              logger.warn('Failed to fetch Sonarr tag definitions', {
                label: 'Calendar FileInfo API',
                errorMessage: (tagError as any).message,
                seriesId: episode.seriesId,
              });
              fileInfo.tags = series.tags; // Fallback to tag IDs
            }
          }
        } catch (seriesError) {
          logger.warn('Failed to fetch series data for external IDs', {
            label: 'Calendar FileInfo API',
            errorMessage: (seriesError as any).message,
            seriesId: episode.seriesId,
          });
        }

        // Get history data for additional file details
        try {
          const historyData = await sonarr.getHistory(Number(itemId));
          const importRecord = historyData.records?.find(
            (record: any) =>
              record.eventType === 'downloadFolderImported' &&
              record.episodeId === Number(itemId)
          );

          if (importRecord) {
            fileInfo.sourceName = importRecord.sourceTitle;
            fileInfo.sourcePath =
              importRecord.data?.droppedPath || importRecord.data?.importedPath;
            fileInfo.libraryPath =
              importRecord.data?.importedPath || fileInfo.path;
            fileInfo.customFormatScore = importRecord.data?.customFormatScore;
            fileInfo.dateFound = importRecord.date;
          }
        } catch (historyError) {
          logger.warn('Failed to fetch Sonarr history data', {
            label: 'Calendar FileInfo API',
            errorMessage: (historyError as any).message,
            episodeId: itemId,
          });
        }

        logger.info('Retrieved Sonarr file info', {
          label: 'Calendar FileInfo API',
          episodeId: itemId,
          fileId: episode.episodeFileId,
        });
      } catch (error) {
        logger.error('Failed to fetch Sonarr file info', {
          label: 'Calendar FileInfo API',
          errorMessage: error.message,
          episodeId: itemId,
        });
        return next({
          status: 500,
          message: 'Failed to fetch file information from Sonarr',
        });
      }
    }

    if (!fileInfo) {
      return next({
        status: 404,
        message: 'File information not found',
      });
    }

    // Fetch MediaRequest data for Added By and Request Date if TMDB ID is available
    if (tmdbId) {
      try {
        const mediaRepository = getRepository(Media);
        const requestRepository = getRepository(MediaRequest);

        const media = await mediaRepository.findOne({
          where: {
            tmdbId: Number(tmdbId),
            mediaType: source === 'radarr' ? MediaType.MOVIE : MediaType.TV,
          },
        });

        if (media) {
          const request = await requestRepository.findOne({
            where: { media: { id: media.id } },
            relations: ['requestedBy'],
            order: { createdAt: 'ASC' }, // Get the first request
          });

          if (request) {
            fileInfo.addedBy =
              request.requestedBy?.displayName || request.requestedBy?.email;
            fileInfo.requestDate = request.createdAt.toISOString();
          }

          // Add tags from the media object if available
          if (media && media.externalServiceSlug) {
            // This would be where we'd add tags from the media
            // For now, keeping it simple
          }
        }
      } catch (mediaError) {
        logger.warn('Failed to fetch MediaRequest data', {
          label: 'Calendar FileInfo API',
          errorMessage: (mediaError as any).message,
          tmdbId,
        });
      }
    }

    // Add service URL and ID for direct links to Sonarr/Radarr
    if (source === 'radarr') {
      const hasServiceId =
        serviceId !== undefined && serviceId !== null && serviceId !== '';
      const radarrSettings = settings.radarr.find((r) =>
        hasServiceId ? r.id === Number(serviceId) : r.isDefault
      );
      if (radarrSettings) {
        const serviceUrl = `${radarrSettings.useSsl ? 'https' : 'http'}://${
          radarrSettings.hostname
        }:${radarrSettings.port}${radarrSettings.baseUrl || ''}`;
        fileInfo.serviceUrl = serviceUrl;
        fileInfo.serviceId = radarrSettings.id;
      }
    } else if (source === 'sonarr') {
      const hasServiceId =
        serviceId !== undefined && serviceId !== null && serviceId !== '';
      const sonarrSettings = settings.sonarr.find((s) =>
        hasServiceId ? s.id === Number(serviceId) : s.isDefault
      );
      if (sonarrSettings) {
        const serviceUrl = `${sonarrSettings.useSsl ? 'https' : 'http'}://${
          sonarrSettings.hostname
        }:${sonarrSettings.port}${sonarrSettings.baseUrl || ''}`;
        fileInfo.serviceUrl = serviceUrl;
        fileInfo.serviceId = sonarrSettings.id;
      }
    }

    return res.status(200).json(fileInfo);
  } catch (error) {
    logger.error('Something went wrong retrieving file info', {
      label: 'Calendar FileInfo API',
      errorMessage: error.message,
    });
    next({ status: 500, message: 'Unable to retrieve file information' });
  }
});

// Delete file for a calendar item
calendarRoutes.delete(
  '/fileinfo',
  isAuthenticated(),
  async (req, res, next) => {
    try {
      // Owner-only guard
      if (!req.user || req.user.id !== 1) {
        return next({
          status: 403,
          message: 'Only the owner can delete files.',
        });
      }
      const settings = getSettings();
      const {
        source,
        fileId,
        itemId,
        serviceId,
        removalMethod = 'file_only',
        blocklistOption = 'do_not_blocklist',
      } = req.body as {
        source?: string;
        fileId?: string | number;
        itemId?: string | number;
        serviceId?: string | number;
        removalMethod?: 'file_only' | 'remove_from_client';
        blocklistOption?:
          | 'do_not_blocklist'
          | 'blocklist_and_search'
          | 'blocklist_only';
      };

      if (!source) {
        return next({
          status: 400,
          message: 'Source parameter is required',
        });
      }

      // For queue deletions, we need itemId; for file deletions, we need fileId
      if (!fileId && !itemId) {
        return next({
          status: 400,
          message: 'Either fileId or itemId parameter is required',
        });
      }

      if (source !== 'radarr' && source !== 'sonarr') {
        return next({
          status: 400,
          message: 'Source must be either radarr or sonarr',
        });
      }

      if (source === 'radarr') {
        // Delete Radarr movie file
        const hasServiceId =
          serviceId !== undefined && serviceId !== null && serviceId !== '';
        const radarrSettings = settings.radarr.find((r) =>
          hasServiceId ? r.id === Number(serviceId) : r.isDefault
        );
        if (!radarrSettings) {
          return next({
            status: 404,
            message: 'No Radarr server configured (by serviceId or default)',
          });
        }

        const radarr = new RadarrAPI({
          apiKey: radarrSettings.apiKey,
          url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
        });

        try {
          await radarr.deleteMovieFile(Number(fileId));

          logger.info('Deleted Radarr file', {
            label: 'Calendar FileInfo API',
            movieId: itemId,
            fileId: fileId,
          });
        } catch (error) {
          logger.error('Failed to delete Radarr file', {
            label: 'Calendar FileInfo API',
            errorMessage: error.message,
            movieId: itemId,
            fileId: fileId,
          });
          return next({
            status: 500,
            message: 'Failed to delete file from Radarr',
          });
        }
      } else {
        // Delete Sonarr episode file
        const hasServiceId =
          serviceId !== undefined && serviceId !== null && serviceId !== '';
        const sonarrSettings = settings.sonarr.find((s) =>
          hasServiceId ? s.id === Number(serviceId) : s.isDefault
        );
        if (!sonarrSettings) {
          return next({
            status: 404,
            message: 'No Sonarr server configured (by serviceId or default)',
          });
        }

        const sonarr = new SonarrAPI({
          apiKey: sonarrSettings.apiKey,
          url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
        });

        try {
          if (removalMethod === 'remove_from_client') {
            // Enhanced removal - remove from download client with blocklist options
            logger.info('Enhanced Sonarr removal requested', {
              label: 'Calendar FileInfo API',
              removalMethod,
              blocklistOption,
              episodeId: itemId,
              fileId: fileId,
            });

            // We need to find the queue item ID first if it's in the queue
            let queueItemId: number | null = null;

            try {
              const queueItems = await sonarr.getQueue();

              // Try to find the queue item by matching episode data
              if (itemId) {
                const episode = await sonarr.getEpisode(Number(itemId));
                const matchingQueueItem = queueItems.find(
                  (item) =>
                    (item as any).seasonNumber === episode.seasonNumber &&
                    item.episodeId === episode.id &&
                    item.seriesId === episode.seriesId
                );

                if (matchingQueueItem) {
                  queueItemId = matchingQueueItem.id;
                  logger.info('Found matching queue item', {
                    label: 'Calendar FileInfo API',
                    queueItemId,
                    title: matchingQueueItem.title,
                  });
                }
              }
            } catch (queueError) {
              logger.warn('Failed to get queue items for enhanced removal', {
                label: 'Calendar FileInfo API',
                errorMessage: queueError.message,
              });
            }

            if (queueItemId) {
              // Remove from queue with enhanced options
              const removalOptions = {
                removeFromClient: true,
                blocklist: blocklistOption !== 'do_not_blocklist',
                skipRedownload: blocklistOption === 'blocklist_only',
              };

              await sonarr.removeQueueItem(queueItemId, removalOptions);

              logger.info('Enhanced Sonarr queue removal completed', {
                label: 'Calendar FileInfo API',
                queueItemId,
                options: removalOptions,
              });
            } else {
              // Fallback to regular file deletion if not in queue
              logger.info(
                'Queue item not found, falling back to file deletion',
                {
                  label: 'Calendar FileInfo API',
                }
              );
              await sonarr.deleteEpisodeFile(Number(fileId));
            }
          } else {
            // Standard file deletion
            await sonarr.deleteEpisodeFile(Number(fileId));
          }

          logger.info('Deleted Sonarr file', {
            label: 'Calendar FileInfo API',
            episodeId: itemId,
            fileId: fileId,
            removalMethod,
            blocklistOption,
          });
        } catch (error) {
          logger.error('Failed to delete Sonarr file', {
            label: 'Calendar FileInfo API',
            errorMessage: error.message,
            episodeId: itemId,
            fileId: fileId,
            removalMethod,
            blocklistOption,
          });
          return next({
            status: 500,
            message: 'Failed to delete file from Sonarr',
          });
        }
      }

      // Immediately refresh download tracker to update Processing view
      // This prevents the 30-second delay waiting for the scheduled Download Sync job
      try {
        await downloadTracker.updateDownloads();
        logger.debug('Download tracker refreshed after file deletion', {
          label: 'Calendar FileInfo API',
          source,
          fileId,
          itemId,
        });
      } catch (updateError) {
        // Log but don't fail the response - file deletion succeeded
        logger.warn(
          'Failed to immediately update download tracker after file deletion',
          {
            label: 'Calendar FileInfo API',
            errorMessage: updateError.message,
            source,
            fileId,
          }
        );
      }

      // Post-deletion queue monitoring: Monitor for immediate new downloads (2s intervals, 15 times)
      // This helps catch any replacement downloads that appear immediately after deletion
      setTimeout(async () => {
        for (let i = 0; i < 15; i++) {
          try {
            await downloadTracker.updateDownloads();
            logger.debug(`Post-deletion queue monitoring check ${i + 1}/15`, {
              label: 'Calendar FileInfo API',
              source,
              fileId,
              itemId,
            });
          } catch (monitorError) {
            logger.warn(
              `Post-deletion queue monitoring failed on check ${i + 1}/15`,
              {
                label: 'Calendar FileInfo API',
                errorMessage: monitorError.message,
                source,
                fileId,
                itemId,
              }
            );
          }

          // Wait 2 seconds before next check (except on the last iteration)
          if (i < 14) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
        logger.debug('Post-deletion queue monitoring completed', {
          label: 'Calendar FileInfo API',
          source,
          fileId,
          itemId,
        });
      }, 1000); // Start monitoring after 1 second delay

      return res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      logger.error('Something went wrong deleting file', {
        label: 'Calendar FileInfo API',
        errorMessage: error.message,
      });
      next({ status: 500, message: 'Unable to delete file' });
    }
  }
);

export default calendarRoutes;
