import TautulliAPI from '@server/api/tautulli';
import { MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { User } from '@server/entity/User';
import type {
  MediaResultsResponse,
  MediaWatchDataResponse,
} from '@server/interfaces/api/mediaInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import type { FindOneOptions } from 'typeorm';
import { In } from 'typeorm';

const mediaRoutes = Router();

mediaRoutes.get('/', async (req, res, next) => {
  const mediaRepository = getRepository(Media);

  const pageSize = req.query.take ? Number(req.query.take) : 20;
  const skip = req.query.skip ? Number(req.query.skip) : 0;

  let statusFilter = undefined;

  switch (req.query.filter) {
    case 'available':
      statusFilter = MediaStatus.AVAILABLE;
      break;
    case 'partial':
      statusFilter = MediaStatus.PARTIALLY_AVAILABLE;
      break;
    case 'allavailable':
      statusFilter = In([
        MediaStatus.AVAILABLE,
        MediaStatus.PARTIALLY_AVAILABLE,
      ]);
      break;
    case 'processing':
      statusFilter = MediaStatus.PROCESSING;
      break;
    case 'pending':
      statusFilter = MediaStatus.PENDING;
      break;
    default:
      statusFilter = undefined;
  }

  let sortFilter: FindOneOptions<Media>['order'] = {
    id: 'DESC',
  };

  switch (req.query.sort) {
    case 'modified':
      sortFilter = {
        updatedAt: 'DESC',
      };
      break;
    case 'mediaAdded':
      sortFilter = {
        mediaAddedAt: 'DESC',
      };
  }

  try {
    const [media, mediaCount] = await mediaRepository.findAndCount({
      order: sortFilter,
      where: statusFilter && {
        status: statusFilter,
      },
      take: pageSize,
      skip,
    });
    return res.status(200).json({
      pageInfo: {
        pages: Math.ceil(mediaCount / pageSize),
        pageSize,
        results: mediaCount,
        page: Math.ceil(skip / pageSize) + 1,
      },
      results: media,
    } as MediaResultsResponse);
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

mediaRoutes.post<
  {
    id: string;
    status: 'available' | 'partial' | 'processing' | 'pending' | 'unknown';
  },
  Media
>(
  '/:id/:status',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    const mediaRepository = getRepository(Media);

    const media = await mediaRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!media) {
      return next({ status: 404, message: 'Media does not exist.' });
    }

    const is4k = Boolean(req.body.is4k);

    switch (req.params.status) {
      case 'available':
        media[is4k ? 'status4k' : 'status'] = MediaStatus.AVAILABLE;
        if (media.mediaType === MediaType.TV) {
          // Mark all seasons available
          media.seasons.forEach((season) => {
            season[is4k ? 'status4k' : 'status'] = MediaStatus.AVAILABLE;
          });
        }
        break;
      case 'partial':
        if (media.mediaType === MediaType.MOVIE) {
          return next({
            status: 400,
            message: 'Only series can be set to be partially available',
          });
        }
        media.status = MediaStatus.PARTIALLY_AVAILABLE;
        break;
      case 'processing':
        media.status = MediaStatus.PROCESSING;
        break;
      case 'pending':
        media.status = MediaStatus.PENDING;
        break;
      case 'unknown':
        media.status = MediaStatus.UNKNOWN;
    }

    await mediaRepository.save(media);

    return res.status(200).json(media);
  }
);

mediaRoutes.delete(
  '/:id',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    try {
      const mediaRepository = getRepository(Media);

      const media = await mediaRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      await mediaRepository.remove(media);

      return res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong fetching media in delete request', {
        label: 'Media',
        message: e.message,
      });
      next({ status: 404, message: 'Media not found' });
    }
  }
);

mediaRoutes.get<{ id: string }, MediaWatchDataResponse>(
  '/:id/watch_data',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    const settings = getSettings().tautulli;

    if (!settings.hostname || !settings.port || !settings.apiKey) {
      return next({
        status: 404,
        message: 'Tautulli API not configured.',
      });
    }

    const media = await getRepository(Media).findOne({
      where: { id: Number(req.params.id) },
    });

    if (!media) {
      return next({ status: 404, message: 'Media does not exist.' });
    }

    try {
      const tautulli = new TautulliAPI(settings);
      const userRepository = getRepository(User);

      const response: MediaWatchDataResponse = {};

      if (media.ratingKey) {
        const watchStats = await tautulli.getMediaWatchStats(media.ratingKey);
        const watchUsers = await tautulli.getMediaWatchUsers(media.ratingKey);

        const users = await userRepository
          .createQueryBuilder('user')
          .where('user.plexId IN (:...plexIds)', {
            plexIds: watchUsers.map((u) => u.user_id),
          })
          .getMany();

        const playCount =
          watchStats.find((i) => i.query_days == 0)?.total_plays ?? 0;

        const playCount7Days =
          watchStats.find((i) => i.query_days == 7)?.total_plays ?? 0;

        const playCount30Days =
          watchStats.find((i) => i.query_days == 30)?.total_plays ?? 0;

        response.data = {
          users: users,
          playCount,
          playCount7Days,
          playCount30Days,
        };
      }

      if (media.ratingKey4k) {
        const watchStats4k = await tautulli.getMediaWatchStats(
          media.ratingKey4k
        );
        const watchUsers4k = await tautulli.getMediaWatchUsers(
          media.ratingKey4k
        );

        const users = await userRepository
          .createQueryBuilder('user')
          .where('user.plexId IN (:...plexIds)', {
            plexIds: watchUsers4k.map((u) => u.user_id),
          })
          .getMany();

        const playCount =
          watchStats4k.find((i) => i.query_days == 0)?.total_plays ?? 0;

        const playCount7Days =
          watchStats4k.find((i) => i.query_days == 7)?.total_plays ?? 0;

        const playCount30Days =
          watchStats4k.find((i) => i.query_days == 30)?.total_plays ?? 0;

        response.data4k = {
          users,
          playCount,
          playCount7Days,
          playCount30Days,
        };
      }

      return res.status(200).json(response);
    } catch (e) {
      logger.error('Something went wrong fetching media watch data', {
        label: 'API',
        errorMessage: e.message,
        mediaId: req.params.id,
      });
      next({ status: 500, message: 'Failed to fetch watch data.' });
    }
  }
);

mediaRoutes.get('/favorites', async (req, res, next) => {

  const mediaRepository = getRepository(Media);

  const page = req.query.page ? Number(req.query.page) : 1;

  const pageSize = 40;
  const skip = (page * pageSize) - pageSize;

  const sortFilter: FindOneOptions<Media>['order'] = {
    mediaAddedAt: 'DESC',
  };

  try {
    const [media, mediaCount] = await mediaRepository.findAndCount({
      order: sortFilter,
      where: {
        isFavorite: true,
      },
      take: pageSize,
      skip,
    });

    const tmdb = new TheMovieDb();
    const infos = []
    for (let m in media) {
      if (media[m]['mediaType'] === 'movie') {
        let tmdbinfo = await tmdb.getMovie({ movieId: media[m].tmdbId, language: req.locale ?? (req.query.language as string) });
        let data = {
          id: media[m].tmdbId,
          mediaType: media[m].mediaType,
          originalLanguage: tmdbinfo.original_language,
          originalTitle: tmdbinfo.original_title,
          overview: tmdbinfo.overview,
          popularity: tmdbinfo.popularity,
          title: tmdbinfo.title,
          backdropPath: tmdbinfo.backdrop_path,
          posterPath: tmdbinfo.poster_path,
          mediaInfo: media[m]
        }
        infos.push(data)
      } else {
        let tmdbinfo = await tmdb.getTvShow({ tvId: media[m].tmdbId, language: req.locale ?? (req.query.language as string) });
        let data = {
          id: media[m].tmdbId,
          mediaType: media[m].mediaType,
          originalLanguage: tmdbinfo.original_language,
          originalName: tmdbinfo.original_name,
          overview: tmdbinfo.overview,
          popularity: tmdbinfo.popularity,
          name: tmdbinfo.name,
          voteAverage: tmdbinfo.vote_average,
          voteCount: tmdbinfo.vote_count,
          backdropPath: tmdbinfo.backdrop_path,
          posterPath: tmdbinfo.poster_path,
          mediaInfo: media[m]
        }
        infos.push(data)
      }
    }

    return res.status(200).json({
      page: page,
      totalPages: Math.ceil(mediaCount / pageSize),
      totalResults: mediaCount,
      results: infos,
    });
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

mediaRoutes.get<{ id: string }>('/favorites/movie/:id', async (req, res, next) => {
  const mediaRepository = getRepository(Media);
  const tmdb = new TheMovieDb();

  try {
    const tmdbMovie = await tmdb.getMovie({
      movieId: Number(req.params.id),
      language: req.locale ?? (req.query.language as string),
    });

    let media = await Media.getMedia(tmdbMovie.id, MediaType.MOVIE);

    if (!media) {
      logger.debug(`Media ${req.params.id} / ${tmdbMovie.id} does not exist.`)

      media = new Media();
      media.tmdbId = tmdbMovie.id;
      media.mediaType = MediaType.MOVIE;
    }

    media.isFavorite = !media.isFavorite
    await mediaRepository.save(media);

    return res.status(200).json({});
  } catch (e) {
    logger.error('Something went wrong fetching media', {
      label: 'API',
      errorMessage: e.message,
      mediaId: req.params.id,
    });
    next({ status: 500, message: 'Failed to fetch media.' });
  }
});

mediaRoutes.get<{ id: string }>('/favorites/tv/:id', async (req, res, next) => {
  const mediaRepository = getRepository(Media);
  const tmdb = new TheMovieDb();

  try {
    const tv = await tmdb.getTvShow({
      tvId: Number(req.params.id),
      language: req.locale ?? (req.query.language as string),
    });

    let media = await Media.getMedia(tv.id, MediaType.TV);

    if (!media) {
      logger.debug(`Media ${req.params.id} / ${tv.id} does not exist.`)

      media = new Media();
      media.tmdbId = tv.id;
      media.mediaType = MediaType.TV;
    }

    media.isFavorite = !media.isFavorite
    await mediaRepository.save(media);

    return res.status(200).json({});
  } catch (e) {
    logger.error('Something went wrong fetching media', {
      label: 'API',
      errorMessage: e.message,
      mediaId: req.params.id,
    });
    next({ status: 500, message: 'Failed to fetch media.' });
  }
});

export default mediaRoutes;
