import MusicBrainzAPI, {
  type MusicBrainzArtist,
  type MusicBrainzReleaseGroup,
} from '@server/api/musicbrainz';
import TheMovieDb from '@server/api/themoviedb';
import type { TmdbSearchMultiResponse } from '@server/api/themoviedb/interfaces';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { findSearchProvider } from '@server/lib/search';
import logger from '@server/logger';
import {
  mapAlbumResult,
  mapArtistResult,
  mapSearchResults,
  mapTrackResult,
  type Results,
} from '@server/models/Search';
import {
  sanitizeSearchQuery,
  toPositiveInteger,
} from '@server/utils/validation';
import { Router } from 'express';
import { In } from 'typeorm';

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
  const year = req.query.year ? Number(req.query.year) : undefined;
  const genre = req.query.genre ? Number(req.query.genre) : undefined;
  const mediaType = req.query.mediaType as
    | 'movie'
    | 'tv'
    | 'artist'
    | 'album'
    | 'track'
    | undefined;
  const status = req.query.status as string | undefined;
  const page =
    toPositiveInteger(
      typeof req.query.page === 'string' ? req.query.page : undefined
    ) ?? 1;
  let tmdbResults: TmdbSearchMultiResponse = {
    page,
    total_pages: 0,
    total_results: 0,
    results: [],
  } as TmdbSearchMultiResponse;
  const musicResults: Results[] = [];

  try {
    // Music-only search: skip TMDB, query MusicBrainz only
    if (mediaType === 'artist' || mediaType === 'album') {
      const musicBrainz = new MusicBrainzAPI();
      const limit = 20;
      const offset = (page - 1) * limit;

      const [artistSearch, albumSearch] = await Promise.allSettled([
        mediaType === 'artist' || !mediaType
          ? musicBrainz.searchArtists(sanitizedQuery, limit, offset)
          : Promise.resolve({ 'artist-list': [] }),
        mediaType === 'album' || !mediaType
          ? musicBrainz.searchReleaseGroups(sanitizedQuery, limit, offset)
          : Promise.resolve({ 'release-group-list': [] }),
      ]);

      const musicBrainzIds: string[] = [];
      if (
        artistSearch.status === 'fulfilled' &&
        artistSearch.value['artist-list']
      ) {
        musicBrainzIds.push(
          ...artistSearch.value['artist-list'].map((a: { id: string }) => a.id)
        );
      }
      if (
        albumSearch.status === 'fulfilled' &&
        albumSearch.value['release-group-list']
      ) {
        musicBrainzIds.push(
          ...albumSearch.value['release-group-list'].map(
            (rg: { id: string }) => rg.id
          )
        );
      }

      const mediaRepository = getRepository(Media);
      const media = musicBrainzIds.length
        ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: In([
              MediaType.ARTIST,
              MediaType.ALBUM,
              MediaType.MUSIC,
            ]),
          })),
        })
        : [];

      if (
        artistSearch.status === 'fulfilled' &&
        artistSearch.value['artist-list']
      ) {
        musicResults.push(
          ...artistSearch.value['artist-list'].map(
            (artist: MusicBrainzArtist) =>
              mapArtistResult(
                artist,
                media.find(
                  (m) =>
                    m.musicBrainzId === artist.id &&
                    (m.mediaType === MediaType.ARTIST ||
                      m.mediaType === MediaType.MUSIC)
                )
              )
          )
        );
      }
      if (
        albumSearch.status === 'fulfilled' &&
        albumSearch.value['release-group-list']
      ) {
        musicResults.push(
          ...albumSearch.value['release-group-list'].map(
            (album: MusicBrainzReleaseGroup) =>
              mapAlbumResult(
                album,
                media.find(
                  (m) =>
                    m.musicBrainzId === album.id &&
                    (m.mediaType === MediaType.ALBUM ||
                      m.mediaType === MediaType.MUSIC)
                )
              )
          )
        );
      }

      const combined = [...musicResults];
      // Use MusicBrainz count for total across all pages; fallback to current-page length if missing
      const artistCount =
        mediaType === 'artist' &&
          artistSearch.status === 'fulfilled' &&
          'count' in artistSearch.value &&
          typeof artistSearch.value.count === 'number'
          ? artistSearch.value.count
          : null;
      const albumCount =
        mediaType === 'album' &&
          albumSearch.status === 'fulfilled' &&
          'count' in albumSearch.value &&
          typeof albumSearch.value.count === 'number'
          ? albumSearch.value.count
          : null;
      const totalCount =
        artistCount !== null
          ? artistCount
          : albumCount !== null
            ? albumCount
            : combined.length;
      return res.status(200).json({
        page,
        results: combined,
        totalResults: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      });
    }

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

      // Use type-specific search if filters are applied (movie/tv only)
      if (mediaType === 'movie' && (year || genre)) {
        const movieResults = await tmdb.searchMovies({
          query: sanitizedQuery,
          page,
          language: (req.query.language as string) ?? req.locale,
          year,
        });
        tmdbResults = {
          ...movieResults,
          results: movieResults.results.map((r) => ({
            ...r,
            media_type: 'movie',
          })),
        } as TmdbSearchMultiResponse;
      } else if (mediaType === 'tv' && (year || genre)) {
        const tvResults = await tmdb.searchTvShows({
          query: sanitizedQuery,
          page,
          language: (req.query.language as string) ?? req.locale,
          year,
        });
        tmdbResults = {
          ...tvResults,
          results: tvResults.results.map((r) => ({ ...r, media_type: 'tv' })),
        } as TmdbSearchMultiResponse;
      } else if (!mediaType || mediaType === 'movie' || mediaType === 'tv') {
        tmdbResults = await tmdb.searchMulti({
          query: sanitizedQuery,
          page,
          language: (req.query.language as string) ?? req.locale,
        });
      }

      // Also search MusicBrainz in parallel (when not filtering to TMDB-only)
      if (!mediaType || mediaType === 'track') {
        try {
          const musicBrainz = new MusicBrainzAPI();
          const limit = 10; // Limit music results per page
          const offset = (page - 1) * limit;
          const shouldSearchArtists = !mediaType;
          const shouldSearchAlbums = !mediaType;
          const shouldSearchTracks = !mediaType || mediaType === 'track';

          const [artistSearch, albumSearch, trackSearch] =
            await Promise.allSettled([
              shouldSearchArtists
                ? musicBrainz.searchArtists(sanitizedQuery, limit, offset)
                : Promise.resolve(null),
              shouldSearchAlbums
                ? musicBrainz.searchReleaseGroups(
                  sanitizedQuery,
                  limit,
                  offset
                )
                : Promise.resolve(null),
              shouldSearchTracks
                ? musicBrainz.searchRecordings(sanitizedQuery, limit, offset)
                : Promise.resolve(null),
            ]);

          const musicBrainzIds: string[] = [];

          if (
            artistSearch.status === 'fulfilled' &&
            artistSearch.value &&
            artistSearch.value['artist-list']
          ) {
            musicBrainzIds.push(
              ...artistSearch.value['artist-list'].map((a) => a.id)
            );
          }

          if (
            albumSearch.status === 'fulfilled' &&
            albumSearch.value &&
            albumSearch.value['release-group-list']
          ) {
            musicBrainzIds.push(
              ...albumSearch.value['release-group-list'].map((rg) => rg.id)
            );
          }

          const mediaRepository = getRepository(Media);
          const media = musicBrainzIds.length
            ? await mediaRepository.find({
              where: musicBrainzIds.map((mbid) => ({
                musicBrainzId: mbid,
                mediaType: In([
                  MediaType.ARTIST,
                  MediaType.ALBUM,
                  MediaType.MUSIC,
                ]),
              })),
            })
            : [];

          if (
            artistSearch.status === 'fulfilled' &&
            artistSearch.value &&
            artistSearch.value['artist-list']
          ) {
            musicResults.push(
              ...artistSearch.value['artist-list'].map((artist) =>
                mapArtistResult(
                  artist,
                  media.find(
                    (m) =>
                      m.musicBrainzId === artist.id &&
                      (m.mediaType === MediaType.ARTIST ||
                        m.mediaType === MediaType.MUSIC)
                  )
                )
              )
            );
          }

          if (
            albumSearch.status === 'fulfilled' &&
            albumSearch.value &&
            albumSearch.value['release-group-list']
          ) {
            musicResults.push(
              ...albumSearch.value['release-group-list'].map((album) =>
                mapAlbumResult(
                  album,
                  media.find(
                    (m) =>
                      m.musicBrainzId === album.id &&
                      (m.mediaType === MediaType.ALBUM ||
                        m.mediaType === MediaType.MUSIC)
                  )
                )
              )
            );
          }
          if (
            trackSearch.status === 'fulfilled' &&
            trackSearch.value &&
            trackSearch.value['recording-list']
          ) {
            musicResults.push(
              ...trackSearch.value['recording-list'].map((recording) =>
                mapTrackResult(recording)
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
    }

    const media = await Media.getRelatedMedia(
      tmdbResults.results.map((result) => result.id)
    );

    const mappedResults = mapSearchResults(tmdbResults.results, media);

    // Combine TMDB and MusicBrainz results
    const allResults = [...mappedResults, ...musicResults];

    // Filter by genre if specified
    if (genre) {
      const filteredResults = allResults.filter((result) => {
        if (
          (result.mediaType === 'movie' || result.mediaType === 'tv') &&
          'genreIds' in result &&
          Array.isArray(result.genreIds)
        ) {
          return result.genreIds.includes(genre);
        }
        return false;
      });
      // Only apply genre filter to movie/TV results, keep music results
      const musicOnlyResults = allResults.filter(
        (result) =>
          result.mediaType === 'artist' ||
          result.mediaType === 'album' ||
          result.mediaType === 'track'
      );
      allResults.splice(
        0,
        allResults.length,
        ...filteredResults,
        ...musicOnlyResults
      );
    }

    // Filter by availability status if specified
    if (status) {
      const filteredResults = allResults.filter((result) => {
        if (
          (result.mediaType === 'movie' || result.mediaType === 'tv') &&
          result.mediaInfo
        ) {
          return result.mediaInfo.status === Number(status);
        }
        // For music, include if status is '0' (unknown/unavailable) or if no status filter
        if (
          result.mediaType === 'artist' ||
          result.mediaType === 'album' ||
          result.mediaType === 'track'
        ) {
          return (
            status === '0' ||
            !result.mediaInfo ||
            result.mediaInfo.status === Number(status)
          );
        }
        return status === '0'; // Unknown/unavailable
      });
      allResults.splice(0, allResults.length, ...filteredResults);
    }

    return res.status(200).json({
      page: tmdbResults.page || page,
      totalPages: tmdbResults.total_pages || 1,
      totalResults: allResults.length,
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

    const page =
      toPositiveInteger(
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

    const page =
      toPositiveInteger(
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
