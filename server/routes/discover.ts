import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapMovieResult, mapTvResult, mapPersonResult } from '../models/Search';
import Media from '../entity/Media';
import { isMovie, isPerson } from '../utils/typeHelpers';
import { MediaType } from '../constants/media';
import { getSettings } from '../lib/settings';
import { User } from '../entity/User';
import { mapProductionCompany } from '../models/Movie';
import { mapNetwork } from '../models/Tv';

const createTmdbWithRegionLanaguage = (user?: User): TheMovieDb => {
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

discoverRoutes.get('/movies', async (req, res) => {
  const tmdb = createTmdbWithRegionLanaguage(req.user);

  const data = await tmdb.getDiscoverMovies({
    page: Number(req.query.page),
    language: req.query.language as string,
    genre: req.query.genre ? Number(req.query.genre) : undefined,
    studio: req.query.studio ? Number(req.query.studio) : undefined,
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
          (req) => req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
        )
      )
    ),
  });
});

discoverRoutes.get<{ genreId: string }>(
  '/movies/genre/:genreId',
  async (req, res) => {
    const tmdb = createTmdbWithRegionLanaguage(req.user);

    const genres = await tmdb.getMovieGenres({
      language: req.query.language as string,
    });

    const genre = genres.find(
      (genre) => genre.id === Number(req.params.genreId)
    );

    const data = await tmdb.getDiscoverMovies({
      page: Number(req.query.page),
      language: req.query.language as string,
      genre: Number(req.params.genreId),
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
  }
);

discoverRoutes.get<{ studioId: string }>(
  '/movies/studio/:studioId',
  async (req, res) => {
    const tmdb = createTmdbWithRegionLanaguage(req.user);

    const studio = await tmdb.getStudio(Number(req.params.studioId));

    const data = await tmdb.getDiscoverMovies({
      page: Number(req.query.page),
      language: req.query.language as string,
      studio: Number(req.params.studioId),
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
            (req) =>
              req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
          )
        )
      ),
    });
  }
);

discoverRoutes.get('/movies/upcoming', async (req, res) => {
  const tmdb = createTmdbWithRegionLanaguage(req.user);

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const date = new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const data = await tmdb.getDiscoverMovies({
    page: Number(req.query.page),
    language: req.query.language as string,
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
          (med) => med.tmdbId === result.id && med.mediaType === MediaType.MOVIE
        )
      )
    ),
  });
});

discoverRoutes.get('/tv', async (req, res) => {
  const tmdb = createTmdbWithRegionLanaguage(req.user);

  const data = await tmdb.getDiscoverTv({
    page: Number(req.query.page),
    language: req.query.language as string,
    genre: req.query.genre ? Number(req.query.genre) : undefined,
    network: req.query.network ? Number(req.query.network) : undefined,
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
});

discoverRoutes.get<{ genreId: string }>(
  '/tv/genre/:genreId',
  async (req, res) => {
    const tmdb = createTmdbWithRegionLanaguage(req.user);

    const genres = await tmdb.getTvGenres({
      language: req.query.language as string,
    });

    const genre = genres.find(
      (genre) => genre.id === Number(req.params.genreId)
    );

    const data = await tmdb.getDiscoverTv({
      page: Number(req.query.page),
      language: req.query.language as string,
      genre: Number(req.params.genreId),
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
            (med) => med.tmdbId === result.id && med.mediaType === MediaType.TV
          )
        )
      ),
    });
  }
);

discoverRoutes.get<{ networkId: string }>(
  '/tv/network/:networkId',
  async (req, res) => {
    const tmdb = createTmdbWithRegionLanaguage(req.user);

    const network = await tmdb.getNetwork(Number(req.params.networkId));

    const data = await tmdb.getDiscoverTv({
      page: Number(req.query.page),
      language: req.query.language as string,
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
            (med) => med.tmdbId === result.id && med.mediaType === MediaType.TV
          )
        )
      ),
    });
  }
);

discoverRoutes.get('/tv/upcoming', async (req, res) => {
  const tmdb = createTmdbWithRegionLanaguage(req.user);

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const date = new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const data = await tmdb.getDiscoverTv({
    page: Number(req.query.page),
    language: req.query.language as string,
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
});

discoverRoutes.get('/trending', async (req, res) => {
  const tmdb = createTmdbWithRegionLanaguage(req.user);

  const data = await tmdb.getAllTrending({
    page: Number(req.query.page),
    language: req.query.language as string,
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
              (req) =>
                req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
            )
          )
        : isPerson(result)
        ? mapPersonResult(result)
        : mapTvResult(
            result,
            media.find((req) => req.tmdbId === result.id && MediaType.TV)
          )
    ),
  });
});

discoverRoutes.get<{ keywordId: string }>(
  '/keyword/:keywordId/movies',
  async (req, res) => {
    const tmdb = new TheMovieDb();

    const data = await tmdb.getMoviesByKeyword({
      keywordId: Number(req.params.keywordId),
      page: Number(req.query.page),
      language: req.query.language as string,
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
            (req) =>
              req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
          )
        )
      ),
    });
  }
);

export default discoverRoutes;
