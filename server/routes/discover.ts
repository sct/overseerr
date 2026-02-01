import PlexTvAPI from '@server/api/plextv';
import type { SortOptions } from '@server/api/themoviedb';
import TheMovieDb from '@server/api/themoviedb';
import MusicBrainzAPI from '@server/api/musicbrainz';
import type { TmdbKeyword } from '@server/api/themoviedb/interfaces';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { User } from '@server/entity/User';
import type {
  GenreSliderItem,
  WatchlistResponse,
} from '@server/interfaces/api/discoverInterfaces';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { mapProductionCompany } from '@server/models/Movie';
import {
  mapCollectionResult,
  mapMovieResult,
  mapPersonResult,
  mapTvResult,
} from '@server/models/Search';
import { mapNetwork } from '@server/models/Tv';
import { isCollection, isMovie, isPerson } from '@server/utils/typeHelpers';
import { sanitizeSearchQuery, validatePagination } from '@server/utils/validation';
import { Router } from 'express';
import { sortBy } from 'lodash';
import { z } from 'zod';

export const createTmdbWithRegionLanguage = (user?: User): TheMovieDb => {
  const settings = getSettings();

  const region =
    user?.settings?.region === 'all'
      ? ''
      : user?.settings?.region
      ? user?.settings?.region
      : settings.main.region;

  const originalLanguage =
    user?.settings?.originalLanguage === 'all'
      ? ''
      : user?.settings?.originalLanguage
      ? user?.settings?.originalLanguage
      : settings.main.originalLanguage;

  return new TheMovieDb({
    region,
    originalLanguage,
  });
};

const discoverRoutes = Router();

const QueryFilterOptions = z.object({
  page: z.coerce.string().optional(),
  sortBy: z.coerce.string().optional(),
  primaryReleaseDateGte: z.coerce.string().optional(),
  primaryReleaseDateLte: z.coerce.string().optional(),
  firstAirDateGte: z.coerce.string().optional(),
  firstAirDateLte: z.coerce.string().optional(),
  studio: z.coerce.string().optional(),
  genre: z.coerce.string().optional(),
  keywords: z.coerce.string().optional(),
  language: z.coerce.string().optional(),
  withRuntimeGte: z.coerce.string().optional(),
  withRuntimeLte: z.coerce.string().optional(),
  voteAverageGte: z.coerce.string().optional(),
  voteAverageLte: z.coerce.string().optional(),
  voteCountGte: z.coerce.string().optional(),
  voteCountLte: z.coerce.string().optional(),
  network: z.coerce.string().optional(),
  watchProviders: z.coerce.string().optional(),
  watchRegion: z.coerce.string().optional(),
});

export type FilterOptions = z.infer<typeof QueryFilterOptions>;

discoverRoutes.get('/movies', async (req, res, next) => {
  const tmdb = createTmdbWithRegionLanguage(req.user);

  try {
    const query = QueryFilterOptions.parse(req.query);
    const keywords = query.keywords;
    
    // Validate and normalize pagination
    const { page, limit } = validatePagination(query.page, undefined, 500);
    
    const data = await tmdb.getDiscoverMovies({
      page,
      sortBy: query.sortBy as SortOptions,
      language: req.locale ?? query.language,
      originalLanguage: query.language,
      genre: query.genre,
      studio: query.studio,
      primaryReleaseDateLte: query.primaryReleaseDateLte
        ? new Date(query.primaryReleaseDateLte).toISOString().split('T')[0]
        : undefined,
      primaryReleaseDateGte: query.primaryReleaseDateGte
        ? new Date(query.primaryReleaseDateGte).toISOString().split('T')[0]
        : undefined,
      keywords,
      withRuntimeGte: query.withRuntimeGte,
      withRuntimeLte: query.withRuntimeLte,
      voteAverageGte: query.voteAverageGte,
      voteAverageLte: query.voteAverageLte,
      voteCountGte: query.voteCountGte,
      voteCountLte: query.voteCountLte,
      watchProviders: query.watchProviders,
      watchRegion: query.watchRegion,
    });

    const media = await Media.getRelatedMedia(
      data.results.map((result) => result.id)
    );

    let keywordData: TmdbKeyword[] = [];
    if (keywords) {
      const splitKeywords = keywords.split(',');

      keywordData = await Promise.all(
        splitKeywords.map(async (keywordId) => {
          return await tmdb.getKeywordDetails({ keywordId: Number(keywordId) });
        })
      );
    }

    return res.status(200).json({
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      keywords: keywordData,
      results: data.results.map((result) =>
        mapMovieResult(
          result,
          media.find(
            (req) =>
              req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
          )
        )
      ),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving popular movies', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve popular movies.',
    });
  }
});

discoverRoutes.get<{ language: string }>(
  '/movies/language/:language',
  async (req, res, next) => {
    const tmdb = createTmdbWithRegionLanguage(req.user);

    try {
      const languages = await tmdb.getLanguages();

      const language = languages.find(
        (lang) => lang.iso_639_1 === req.params.language
      );

      if (!language) {
        return next({ status: 404, message: 'Language not found.' });
      }

      const data = await tmdb.getDiscoverMovies({
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
        originalLanguage: req.params.language,
      });

      const media = await Media.getRelatedMedia(
        data.results.map((result) => result.id)
      );

      return res.status(200).json({
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        language,
        results: data.results.map((result) =>
          mapMovieResult(
            result,
            media.find(
              (req) =>
                req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
            )
          )
        ),
      });
    } catch (e) {
      logger.debug('Something went wrong retrieving movies by language', {
        label: 'API',
        errorMessage: e.message,
        language: req.params.language,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve movies by language.',
      });
    }
  }
);

discoverRoutes.get<{ genreId: string }>(
  '/movies/genre/:genreId',
  async (req, res, next) => {
    const tmdb = createTmdbWithRegionLanguage(req.user);

    try {
      const genres = await tmdb.getMovieGenres({
        language: (req.query.language as string) ?? req.locale,
      });

      const genre = genres.find(
        (genre) => genre.id === Number(req.params.genreId)
      );

      if (!genre) {
        return next({ status: 404, message: 'Genre not found.' });
      }

      const data = await tmdb.getDiscoverMovies({
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
        genre: req.params.genreId as string,
      });

      const media = await Media.getRelatedMedia(
        data.results.map((result) => result.id)
      );

      return res.status(200).json({
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        genre,
        results: data.results.map((result) =>
          mapMovieResult(
            result,
            media.find(
              (req) =>
                req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
            )
          )
        ),
      });
    } catch (e) {
      logger.debug('Something went wrong retrieving movies by genre', {
        label: 'API',
        errorMessage: e.message,
        genreId: req.params.genreId,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve movies by genre.',
      });
    }
  }
);

discoverRoutes.get<{ studioId: string }>(
  '/movies/studio/:studioId',
  async (req, res, next) => {
    const tmdb = new TheMovieDb();

    try {
      const studio = await tmdb.getStudio(Number(req.params.studioId));

      const data = await tmdb.getDiscoverMovies({
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
        studio: req.params.studioId as string,
      });

      const media = await Media.getRelatedMedia(
        data.results.map((result) => result.id)
      );

      return res.status(200).json({
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        studio: mapProductionCompany(studio),
        results: data.results.map((result) =>
          mapMovieResult(
            result,
            media.find(
              (med) =>
                med.tmdbId === result.id && med.mediaType === MediaType.MOVIE
            )
          )
        ),
      });
    } catch (e) {
      logger.debug('Something went wrong retrieving movies by studio', {
        label: 'API',
        errorMessage: e.message,
        studioId: req.params.studioId,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve movies by studio.',
      });
    }
  }
);

discoverRoutes.get('/movies/upcoming', async (req, res, next) => {
  const tmdb = createTmdbWithRegionLanguage(req.user);

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const date = new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .split('T')[0];

  try {
    const data = await tmdb.getDiscoverMovies({
      page: Number(req.query.page),
      language: (req.query.language as string) ?? req.locale,
      primaryReleaseDateGte: date,
    });

    const media = await Media.getRelatedMedia(
      data.results.map((result) => result.id)
    );

    return res.status(200).json({
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: data.results.map((result) =>
        mapMovieResult(
          result,
          media.find(
            (med) =>
              med.tmdbId === result.id && med.mediaType === MediaType.MOVIE
          )
        )
      ),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving upcoming movies', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve upcoming movies.',
    });
  }
});

discoverRoutes.get('/tv', async (req, res, next) => {
  const tmdb = createTmdbWithRegionLanguage(req.user);

  try {
    const query = QueryFilterOptions.parse(req.query);
    const keywords = query.keywords;
    
    // Validate and normalize pagination
    const { page, limit } = validatePagination(query.page, undefined, 500);
    
    const data = await tmdb.getDiscoverTv({
      page,
      sortBy: query.sortBy as SortOptions,
      language: req.locale ?? query.language,
      genre: query.genre,
      network: query.network ? Number(query.network) : undefined,
      firstAirDateLte: query.firstAirDateLte
        ? new Date(query.firstAirDateLte).toISOString().split('T')[0]
        : undefined,
      firstAirDateGte: query.firstAirDateGte
        ? new Date(query.firstAirDateGte).toISOString().split('T')[0]
        : undefined,
      originalLanguage: query.language,
      keywords,
      withRuntimeGte: query.withRuntimeGte,
      withRuntimeLte: query.withRuntimeLte,
      voteAverageGte: query.voteAverageGte,
      voteAverageLte: query.voteAverageLte,
      voteCountGte: query.voteCountGte,
      voteCountLte: query.voteCountLte,
      watchProviders: query.watchProviders,
      watchRegion: query.watchRegion,
    });

    const media = await Media.getRelatedMedia(
      data.results.map((result) => result.id)
    );

    let keywordData: TmdbKeyword[] = [];
    if (keywords) {
      const splitKeywords = keywords.split(',');

      keywordData = await Promise.all(
        splitKeywords.map(async (keywordId) => {
          return await tmdb.getKeywordDetails({ keywordId: Number(keywordId) });
        })
      );
    }

    return res.status(200).json({
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      keywords: keywordData,
      results: data.results.map((result) =>
        mapTvResult(
          result,
          media.find(
            (med) => med.tmdbId === result.id && med.mediaType === MediaType.TV
          )
        )
      ),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving popular series', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve popular series.',
    });
  }
});

discoverRoutes.get<{ language: string }>(
  '/tv/language/:language',
  async (req, res, next) => {
    const tmdb = createTmdbWithRegionLanguage(req.user);

    try {
      const languages = await tmdb.getLanguages();

      const language = languages.find(
        (lang) => lang.iso_639_1 === req.params.language
      );

      if (!language) {
        return next({ status: 404, message: 'Language not found.' });
      }

      const data = await tmdb.getDiscoverTv({
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
        originalLanguage: req.params.language,
      });

      const media = await Media.getRelatedMedia(
        data.results.map((result) => result.id)
      );

      return res.status(200).json({
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        language,
        results: data.results.map((result) =>
          mapTvResult(
            result,
            media.find(
              (med) =>
                med.tmdbId === result.id && med.mediaType === MediaType.TV
            )
          )
        ),
      });
    } catch (e) {
      logger.debug('Something went wrong retrieving series by language', {
        label: 'API',
        errorMessage: e.message,
        language: req.params.language,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve series by language.',
      });
    }
  }
);

discoverRoutes.get<{ genreId: string }>(
  '/tv/genre/:genreId',
  async (req, res, next) => {
    const tmdb = createTmdbWithRegionLanguage(req.user);

    try {
      const genres = await tmdb.getTvGenres({
        language: (req.query.language as string) ?? req.locale,
      });

      const genre = genres.find(
        (genre) => genre.id === Number(req.params.genreId)
      );

      if (!genre) {
        return next({ status: 404, message: 'Genre not found.' });
      }

      const data = await tmdb.getDiscoverTv({
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
        genre: req.params.genreId,
      });

      const media = await Media.getRelatedMedia(
        data.results.map((result) => result.id)
      );

      return res.status(200).json({
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        genre,
        results: data.results.map((result) =>
          mapTvResult(
            result,
            media.find(
              (med) =>
                med.tmdbId === result.id && med.mediaType === MediaType.TV
            )
          )
        ),
      });
    } catch (e) {
      logger.debug('Something went wrong retrieving series by genre', {
        label: 'API',
        errorMessage: e.message,
        genreId: req.params.genreId,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve series by genre.',
      });
    }
  }
);

discoverRoutes.get<{ networkId: string }>(
  '/tv/network/:networkId',
  async (req, res, next) => {
    const tmdb = new TheMovieDb();

    try {
      const network = await tmdb.getNetwork(Number(req.params.networkId));

      const data = await tmdb.getDiscoverTv({
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
        network: Number(req.params.networkId),
      });

      const media = await Media.getRelatedMedia(
        data.results.map((result) => result.id)
      );

      return res.status(200).json({
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        network: mapNetwork(network),
        results: data.results.map((result) =>
          mapTvResult(
            result,
            media.find(
              (med) =>
                med.tmdbId === result.id && med.mediaType === MediaType.TV
            )
          )
        ),
      });
    } catch (e) {
      logger.debug('Something went wrong retrieving series by network', {
        label: 'API',
        errorMessage: e.message,
        networkId: req.params.networkId,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve series by network.',
      });
    }
  }
);

discoverRoutes.get('/tv/upcoming', async (req, res, next) => {
  const tmdb = createTmdbWithRegionLanguage(req.user);

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const date = new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .split('T')[0];

  try {
    const data = await tmdb.getDiscoverTv({
      page: Number(req.query.page),
      language: (req.query.language as string) ?? req.locale,
      firstAirDateGte: date,
    });

    const media = await Media.getRelatedMedia(
      data.results.map((result) => result.id)
    );

    return res.status(200).json({
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: data.results.map((result) =>
        mapTvResult(
          result,
          media.find(
            (med) => med.tmdbId === result.id && med.mediaType === MediaType.TV
          )
        )
      ),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving upcoming series', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve upcoming series.',
    });
  }
});

discoverRoutes.get('/trending', async (req, res, next) => {
  const tmdb = createTmdbWithRegionLanguage(req.user);

  try {
    const data = await tmdb.getAllTrending({
      page: Number(req.query.page),
      language: (req.query.language as string) ?? req.locale,
    });

    const media = await Media.getRelatedMedia(
      data.results.map((result) => result.id)
    );

    return res.status(200).json({
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: data.results.map((result) =>
        isMovie(result)
          ? mapMovieResult(
              result,
              media.find(
                (med) =>
                  med.tmdbId === result.id && med.mediaType === MediaType.MOVIE
              )
            )
          : isPerson(result)
          ? mapPersonResult(result)
          : isCollection(result)
          ? mapCollectionResult(result)
          : mapTvResult(
              result,
              media.find(
                (med) =>
                  med.tmdbId === result.id && med.mediaType === MediaType.TV
              )
            )
      ),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving trending items', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve trending items.',
    });
  }
});

discoverRoutes.get<{ keywordId: string }>(
  '/keyword/:keywordId/movies',
  async (req, res, next) => {
    const tmdb = new TheMovieDb();

    try {
      const data = await tmdb.getMoviesByKeyword({
        keywordId: Number(req.params.keywordId),
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
      });

      const media = await Media.getRelatedMedia(
        data.results.map((result) => result.id)
      );

      return res.status(200).json({
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        results: data.results.map((result) =>
          mapMovieResult(
            result,
            media.find(
              (med) =>
                med.tmdbId === result.id && med.mediaType === MediaType.MOVIE
            )
          )
        ),
      });
    } catch (e) {
      logger.debug('Something went wrong retrieving movies by keyword', {
        label: 'API',
        errorMessage: e.message,
        keywordId: req.params.keywordId,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve movies by keyword.',
      });
    }
  }
);

discoverRoutes.get<{ language: string }, GenreSliderItem[]>(
  '/genreslider/movie',
  async (req, res, next) => {
    const tmdb = new TheMovieDb();

    try {
      const mappedGenres: GenreSliderItem[] = [];

      const genres = await tmdb.getMovieGenres({
        language: (req.query.language as string) ?? req.locale,
      });

      await Promise.all(
        genres.map(async (genre) => {
          const genreData = await tmdb.getDiscoverMovies({
            genre: genre.id.toString(),
          });

          mappedGenres.push({
            id: genre.id,
            name: genre.name,
            backdrops: genreData.results
              .filter((title) => !!title.backdrop_path)
              .map((title) => title.backdrop_path) as string[],
          });
        })
      );

      const sortedData = sortBy(mappedGenres, 'name');

      return res.status(200).json(sortedData);
    } catch (e) {
      logger.debug('Something went wrong retrieving the movie genre slider', {
        label: 'API',
        errorMessage: e.message,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve movie genre slider.',
      });
    }
  }
);

discoverRoutes.get<{ language: string }, GenreSliderItem[]>(
  '/genreslider/tv',
  async (req, res, next) => {
    const tmdb = new TheMovieDb();

    try {
      const mappedGenres: GenreSliderItem[] = [];

      const genres = await tmdb.getTvGenres({
        language: (req.query.language as string) ?? req.locale,
      });

      await Promise.all(
        genres.map(async (genre) => {
          const genreData = await tmdb.getDiscoverTv({
            genre: genre.id.toString(),
          });

          mappedGenres.push({
            id: genre.id,
            name: genre.name,
            backdrops: genreData.results
              .filter((title) => !!title.backdrop_path)
              .map((title) => title.backdrop_path) as string[],
          });
        })
      );

      const sortedData = sortBy(mappedGenres, 'name');

      return res.status(200).json(sortedData);
    } catch (e) {
      logger.debug('Something went wrong retrieving the series genre slider', {
        label: 'API',
        errorMessage: e.message,
      });
      return next({
        status: 500,
        message: 'Unable to retrieve series genre slider.',
      });
    }
  }
);

discoverRoutes.get<Record<string, unknown>, WatchlistResponse>(
  '/watchlist',
  async (req, res) => {
    const userRepository = getRepository(User);
    const itemsPerPage = 20;
    const page = Number(req.query.page) ?? 1;
    const offset = (page - 1) * itemsPerPage;

    const activeUser = await userRepository.findOne({
      where: { id: req.user?.id },
      select: ['id', 'plexToken'],
    });

    if (!activeUser?.plexToken) {
      // We will just return an empty array if the user has no Plex token
      return res.json({
        page: 1,
        totalPages: 1,
        totalResults: 0,
        results: [],
      });
    }

    const plexTV = new PlexTvAPI(activeUser.plexToken);

    const watchlist = await plexTV.getWatchlist({ offset });

    return res.json({
      page,
      totalPages: Math.ceil(watchlist.totalSize / itemsPerPage),
      totalResults: watchlist.totalSize,
      results: watchlist.items.map((item) => ({
        ratingKey: item.ratingKey,
        title: item.title,
        mediaType: item.type === 'show' ? 'tv' : 'movie',
        tmdbId: item.tmdbId,
      })),
    });
  }
);

discoverRoutes.get('/artists', async (req, res, next) => {
  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      25,
      100
    );
    
    // Build query with optional filters
    let queryParts: string[] = [];
    
    // Tag filter
    if (req.query.tag && typeof req.query.tag === 'string') {
      queryParts.push(`tag:${sanitizeSearchQuery(req.query.tag)}`);
    }
    
    // Type filter (Person, Group, Orchestra, etc.)
    if (req.query.type && typeof req.query.type === 'string') {
      queryParts.push(`type:${sanitizeSearchQuery(req.query.type)}`);
    }
    
    // Country filter
    if (req.query.country && typeof req.query.country === 'string') {
      queryParts.push(`country:${sanitizeSearchQuery(req.query.country)}`);
    }
    
    // Default query if no filters
    const query = queryParts.length > 0 
      ? queryParts.join(' AND ')
      : sanitizeSearchQuery((req.query.query as string) || '*');

    const results = await musicBrainz.searchArtists(query, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      results['artist-list']?.map((artist) => artist.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ARTIST,
          })),
        })
      : [];

    // Apply sorting if requested
    let sortedResults = results['artist-list'] || [];
    if (req.query.sortBy === 'name') {
      sortedResults = [...sortedResults].sort((a, b) => 
        (a['sort-name'] || a.name).localeCompare(b['sort-name'] || b.name)
      );
    } else if (req.query.sortBy === 'tagcount') {
      sortedResults = [...sortedResults].sort((a, b) => {
        const tagsA = a.tags || a['tag-list'] || [];
        const tagsB = b.tags || b['tag-list'] || [];
        const countA = tagsA.reduce((sum, tag) => sum + (tag.count || 0), 0);
        const countB = tagsB.reduce((sum, tag) => sum + (tag.count || 0), 0);
        return countB - countA;
      });
    }

    return res.status(200).json({
      page,
      totalPages: Math.ceil((results.count || 0) / limit),
      totalResults: results.count || 0,
      results: sortedResults.map((artist) => ({
        id: artist.id,
        mediaType: 'artist',
        name: artist.name,
        sortName: artist['sort-name'],
        disambiguation: artist.disambiguation,
        country: artist.country,
        type: artist.type,
        area: artist.area,
        mediaInfo: media.find((m) => m.musicBrainzId === artist.id),
      })), 
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving artists', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve artists.',
    });
  }
});

discoverRoutes.get('/albums', async (req, res, next) => {
  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      25,
      100
    );
    
    // Build query with optional filters
    let queryParts: string[] = [];
    
    // Tag filter
    if (req.query.tag && typeof req.query.tag === 'string') {
      queryParts.push(`tag:${sanitizeSearchQuery(req.query.tag)}`);
    }
    
    // Album type filter (Album, Single, EP, Compilation, etc.)
    if (req.query.primaryType && typeof req.query.primaryType === 'string') {
      queryParts.push(`primarytype:${sanitizeSearchQuery(req.query.primaryType)}`);
    } else {
      // Default to Album if no type specified
      queryParts.push('primarytype:Album');
    }
    
    // Date range filters
    if (req.query.firstReleaseDateGte && typeof req.query.firstReleaseDateGte === 'string') {
      queryParts.push(`firstreleasedate:[${sanitizeSearchQuery(req.query.firstReleaseDateGte)} TO *]`);
    }
    if (req.query.firstReleaseDateLte && typeof req.query.firstReleaseDateLte === 'string') {
      queryParts.push(`firstreleasedate:[* TO ${sanitizeSearchQuery(req.query.firstReleaseDateLte)}]`);
    }
    
    // Default query if no filters
    const query = queryParts.length > 0 
      ? queryParts.join(' AND ')
      : sanitizeSearchQuery((req.query.query as string) || '*');

    const results = await musicBrainz.searchReleaseGroups(query, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      results['release-group-list']?.map((rg) => rg.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ALBUM,
          })),
        })
      : [];

    // Apply sorting if requested
    let sortedResults = results['release-group-list'] || [];
    if (req.query.sortBy === 'title') {
      sortedResults = [...sortedResults].sort((a, b) => 
        a.title.localeCompare(b.title)
      );
    } else if (req.query.sortBy === 'date') {
      sortedResults = [...sortedResults].sort((a, b) => {
        const dateA = a['first-release-date'] || '';
        const dateB = b['first-release-date'] || '';
        return dateB.localeCompare(dateA); // Newest first
      });
    } else if (req.query.sortBy === 'tagcount') {
      sortedResults = [...sortedResults].sort((a, b) => {
        const tagsA = a.tags || a['tag-list'] || [];
        const tagsB = b.tags || b['tag-list'] || [];
        const countA = tagsA.reduce((sum, tag) => sum + (tag.count || 0), 0);
        const countB = tagsB.reduce((sum, tag) => sum + (tag.count || 0), 0);
        return countB - countA;
      });
    }

    return res.status(200).json({
      page,
      totalPages: Math.ceil((results.count || 0) / limit),
      totalResults: results.count || 0,
      results: sortedResults.map((rg) => ({
        id: rg.id,
        mediaType: 'album',
        title: rg.title,
        primaryType: rg['primary-type'],
        secondaryTypes: rg['secondary-types'] || [],
        firstReleaseDate: rg['first-release-date'],
        disambiguation: rg.disambiguation,
        artistCredit: rg['artist-credit'] || [],
        tags: rg.tags || rg['tag-list'] || [],
        mediaInfo: media.find((m) => m.musicBrainzId === rg.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving albums', { 
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve albums.',
    });
  }
});

discoverRoutes.get('/albums/upcoming', async (req, res, next) => {
  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      25,
      100
    );

    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    const date = new Date(now.getTime() - timezoneOffset * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Search for albums with release date >= today
    const query = `firstreleasedate:[${date} TO *] AND primarytype:Album`;
    const results = await musicBrainz.searchReleaseGroups(query, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      results['release-group-list']?.map((rg) => rg.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ALBUM,
          })),
        })
      : [];

    // Sort by release date ascending
    const sortedResults = (results['release-group-list'] || []).sort((a, b) => {
      const dateA = a['first-release-date'] || '';
      const dateB = b['first-release-date'] || '';
      return dateA.localeCompare(dateB);
    });

    return res.status(200).json({
      page,
      totalPages: Math.ceil((results.count || 0) / limit),
      totalResults: results.count || 0,
      results: sortedResults.map((rg) => ({
        id: rg.id,
        mediaType: 'album',
        title: rg.title,
        primaryType: rg['primary-type'],
        secondaryTypes: rg['secondary-types'] || [],
        firstReleaseDate: rg['first-release-date'],
        disambiguation: rg.disambiguation,
        artistCredit: rg['artist-credit'] || [],
        mediaInfo: media.find((m) => m.musicBrainzId === rg.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving upcoming albums', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve upcoming albums.',
    });
  }
});

discoverRoutes.get('/albums/popular', async (req, res, next) => {
  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      25,
      100
    );

    // Search for albums sorted by tag count (popularity proxy)
    // Using a broad query and sorting by tag count
    const query = 'primarytype:Album AND tagcount:[1 TO *]';
    const results = await musicBrainz.searchReleaseGroups(query, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      results['release-group-list']?.map((rg) => rg.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ALBUM,
          })),
        })
      : [];

    // Sort by tag count descending (most tagged = most popular)
    const sortedResults = (results['release-group-list'] || []).sort((a, b) => {
      const tagsA = a.tags || a['tag-list'] || [];
      const tagsB = b.tags || b['tag-list'] || [];
      const countA = tagsA.reduce((sum, tag) => sum + (tag.count || 0), 0);
      const countB = tagsB.reduce((sum, tag) => sum + (tag.count || 0), 0);
      return countB - countA;
    });

    return res.status(200).json({
      page,
      totalPages: Math.ceil((results.count || 0) / limit),
      totalResults: results.count || 0,
      results: sortedResults.map((rg) => ({
        id: rg.id,
        mediaType: 'album',
        title: rg.title,
        primaryType: rg['primary-type'],
        secondaryTypes: rg['secondary-types'] || [],
        firstReleaseDate: rg['first-release-date'],
        disambiguation: rg.disambiguation,
        artistCredit: rg['artist-credit'] || [],
        tags: rg.tags || rg['tag-list'] || [],
        mediaInfo: media.find((m) => m.musicBrainzId === rg.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving popular albums', { 
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve popular albums.',
    });
  }
});

discoverRoutes.get('/artists/popular', async (req, res, next) => {
  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      25,
      100
    );

    // Search for artists sorted by tag count (popularity proxy)
    const query = 'tagcount:[1 TO *]';
    const results = await musicBrainz.searchArtists(query, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      results['artist-list']?.map((artist) => artist.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ARTIST,
          })),
        })
      : [];

    // Sort by tag count descending (most tagged = most popular)
    const sortedResults = (results['artist-list'] || []).sort((a, b) => {
      const tagsA = a.tags || a['tag-list'] || [];
      const tagsB = b.tags || b['tag-list'] || [];
      const countA = tagsA.reduce((sum, tag) => sum + (tag.count || 0), 0);
      const countB = tagsB.reduce((sum, tag) => sum + (tag.count || 0), 0);
      return countB - countA;
    });

    return res.status(200).json({
      page,
      totalPages: Math.ceil((results.count || 0) / limit),
      totalResults: results.count || 0,
      results: sortedResults.map((artist) => ({
        id: artist.id,
        mediaType: 'artist',
        name: artist.name,
        sortName: artist['sort-name'],
        disambiguation: artist.disambiguation,
        country: artist.country,
        type: artist.type,
        area: artist.area,
        tags: artist.tags || artist['tag-list'] || [],
        mediaInfo: media.find((m) => m.musicBrainzId === artist.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving popular artists', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve popular artists.',
    });
  }
});

discoverRoutes.get<{ tag: string }>('/artists/tag/:tag', async (req, res, next) => {
  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      25,
      100
    );
    const tag = sanitizeSearchQuery(req.params.tag);

    // Search for artists with specific tag
    const query = `tag:${tag}`;
    const results = await musicBrainz.searchArtists(query, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      results['artist-list']?.map((artist) => artist.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ARTIST,
          })),
        })
      : [];

    return res.status(200).json({
      page,
      totalPages: Math.ceil((results.count || 0) / limit),
      totalResults: results.count || 0,
      tag,
      results: (results['artist-list'] || []).map((artist) => ({
        id: artist.id,
        name: artist.name,
        sortName: artist['sort-name'],
        disambiguation: artist.disambiguation,
        country: artist.country,
        type: artist.type,
        area: artist.area,
        tags: artist.tags || artist['tag-list'] || [],
        mediaInfo: media.find((m) => m.musicBrainzId === artist.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving artists by tag', {
      label: 'API',
      errorMessage: e.message,
      tag: req.params.tag,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve artists by tag.',
    });
  }
});

discoverRoutes.get<{ tag: string }>('/albums/tag/:tag', async (req, res, next) => {
  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      25,
      100
    );
    const tag = sanitizeSearchQuery(req.params.tag);

    // Search for albums with specific tag
    const query = `tag:${tag} AND primarytype:Album`;
    const results = await musicBrainz.searchReleaseGroups(query, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      results['release-group-list']?.map((rg) => rg.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ALBUM,
          })),
        })
      : [];

    return res.status(200).json({
      page,
      totalPages: Math.ceil((results.count || 0) / limit),
      totalResults: results.count || 0,
      tag,
      results: (results['release-group-list'] || []).map((rg) => ({
        id: rg.id,
        title: rg.title,
        primaryType: rg['primary-type'],
        secondaryTypes: rg['secondary-types'] || [],
        firstReleaseDate: rg['first-release-date'],
        disambiguation: rg.disambiguation,
        artistCredit: rg['artist-credit'] || [],
        tags: rg.tags || rg['tag-list'] || [],
        mediaInfo: media.find((m) => m.musicBrainzId === rg.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving albums by tag', {
      label: 'API',
      errorMessage: e.message,
      tag: req.params.tag,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve albums by tag.',
    });
  }
});

export default discoverRoutes;
