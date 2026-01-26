import TheMovieDb from '@server/api/themoviedb';
import type { TmdbSearchMultiResponse } from '@server/api/themoviedb/interfaces';
import MusicBrainzAPI from '@server/api/musicbrainz';
import Media from '@server/entity/Media';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import { findSearchProvider } from '@server/lib/search';
import logger from '@server/logger';
import { mapSearchResults, mapArtistResult, mapAlbumResult, type Results } from '@server/models/Search';
import { sanitizeSearchQuery, toPositiveInteger } from '@server/utils/validation';
import { In } from 'typeorm';
import { Router } from 'express';

const searchRoutes = Router();

searchRoutes.get('/', async (req, res, next) => {
  const queryString = req.query.query as string;
  
  if (!queryString || typeof queryString !== 'string') {
    return next({
      status: 400,
      message: 'Search query is required.',
    });
  }
  
  // Sanitize search query to prevent injection attacks
  const sanitizedQuery = sanitizeSearchQuery(queryString);
  
  if (!sanitizedQuery || sanitizedQuery.length === 0) {
    return next({
      status: 400,
      message: 'Invalid search query.',
    });
  }
  
  const searchProvider = findSearchProvider(sanitizedQuery.toLowerCase());
  let tmdbResults: TmdbSearchMultiResponse;
  let musicResults: Results[] = [];

  try {
    if (searchProvider) {
      const [id] = sanitizedQuery
        .toLowerCase()
        .match(searchProvider.pattern) as RegExpMatchArray;
      tmdbResults = await searchProvider.search({
        id,
        language: (req.query.language as string) ?? req.locale,
        query: sanitizedQuery,
      });
    } else {
      const tmdb = new TheMovieDb();

      const page = toPositiveInteger(
      typeof req.query.page === 'string' ? req.query.page : undefined
    ) ?? 1;

      tmdbResults = await tmdb.searchMulti({
        query: sanitizedQuery,
        page,
        language: (req.query.language as string) ?? req.locale,
      });

      // Also search MusicBrainz in parallel
      try {
        const musicBrainz = new MusicBrainzAPI();
        const limit = 10; // Limit music results per page
        const offset = (page - 1) * limit;

        const [artistSearch, albumSearch] = await Promise.allSettled([
          musicBrainz.searchArtists(sanitizedQuery, limit, offset),
          musicBrainz.searchReleaseGroups(sanitizedQuery, limit, offset),
        ]);

        const musicBrainzIds: string[] = [];
        
        if (artistSearch.status === 'fulfilled' && artistSearch.value['artist-list']) {
          musicBrainzIds.push(...artistSearch.value['artist-list'].map((a) => a.id));
        }
        
        if (albumSearch.status === 'fulfilled' && albumSearch.value['release-group-list']) {
          musicBrainzIds.push(...albumSearch.value['release-group-list'].map((rg) => rg.id));
        }

        const mediaRepository = getRepository(Media);
        const media = musicBrainzIds.length
          ? await mediaRepository.find({
              where: musicBrainzIds.map((mbid) => ({
                musicBrainzId: mbid,
                mediaType: In([MediaType.ARTIST, MediaType.ALBUM, MediaType.MUSIC]),
              })),
            })
          : [];

        if (artistSearch.status === 'fulfilled' && artistSearch.value['artist-list']) {
          musicResults.push(
            ...artistSearch.value['artist-list'].map((artist) =>
              mapArtistResult(
                artist,
                media.find(
                  (m) =>
                    m.musicBrainzId === artist.id &&
                    (m.mediaType === MediaType.ARTIST || m.mediaType === MediaType.MUSIC)
                )
              )
            )
          );
        }

        if (albumSearch.status === 'fulfilled' && albumSearch.value['release-group-list']) {
          musicResults.push(
            ...albumSearch.value['release-group-list'].map((album) =>
              mapAlbumResult(
                album,
                media.find(
                  (m) =>
                    m.musicBrainzId === album.id &&
                    (m.mediaType === MediaType.ALBUM || m.mediaType === MediaType.MUSIC)
                )
              )
            )
          );
        }
      } catch (musicError) {
        // Log but don't fail the entire search if music search fails
        logger.debug('MusicBrainz search failed', {
          label: 'API',
          errorMessage: musicError.message,
          query: sanitizedQuery,
        });
      }
    }

    const media = await Media.getRelatedMedia(
      tmdbResults.results.map((result) => result.id)
    );

    const tmdbMappedResults = mapSearchResults(tmdbResults.results, media);
    
    // Combine TMDB and MusicBrainz results
    const allResults = [...tmdbMappedResults, ...musicResults];

    return res.status(200).json({
      page: tmdbResults.page,
      totalPages: tmdbResults.total_pages,
      totalResults: tmdbResults.total_results + musicResults.length,
      results: allResults,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving search results', {
      label: 'API',
      errorMessage: e.message,
      query: sanitizedQuery,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve search results.',
    });
  }
});

searchRoutes.get('/keyword', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const query = req.query.query as string;
    if (!query || typeof query !== 'string') {
      return next({
        status: 400,
        message: 'Search query is required.',
      });
    }
    
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery || sanitizedQuery.length === 0) {
      return next({
        status: 400,
        message: 'Invalid search query.',
      });
    }

    const page = toPositiveInteger(
      typeof req.query.page === 'string' ? req.query.page : undefined
    ) ?? 1;

    const results = await tmdb.searchKeyword({
      query: sanitizedQuery,
      page,
    });

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving keyword search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve keyword search results.',
    });
  }
});

searchRoutes.get('/company', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const query = req.query.query as string;
    if (!query || typeof query !== 'string') {
      return next({
        status: 400,
        message: 'Search query is required.',
      });
    }
    
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery || sanitizedQuery.length === 0) {
      return next({
        status: 400,
        message: 'Invalid search query.',
      });
    }

    const page = toPositiveInteger(
      typeof req.query.page === 'string' ? req.query.page : undefined
    ) ?? 1;

    const results = await tmdb.searchCompany({
      query: sanitizedQuery,
      page,
    });

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving company search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve company search results.',
    });
  }
});

export default searchRoutes;
