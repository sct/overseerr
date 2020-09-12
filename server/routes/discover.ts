import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapMovieResult, mapTvResult } from '../models/Search';
import { getRepository, In } from 'typeorm';
import Request from '../entity/Request';

const discoverRoutes = Router();

discoverRoutes.get('/movies', async (req, res) => {
  const tmdb = new TheMovieDb();
  const requestRepository = getRepository(Request);

  const data = await tmdb.getDiscoverMovies({ page: Number(req.query.page) });

  const resultIds = data.results.map((result) => result.id);

  const requests = await requestRepository.find({
    mediaId: In(resultIds),
  });

  return res.status(200).json({
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map((result) =>
      mapMovieResult(
        result,
        requests.find((req) => req.mediaId === result.id)
      )
    ),
  });
});

discoverRoutes.get('/tv', async (req, res) => {
  const tmdb = new TheMovieDb();
  const requestRepository = getRepository(Request);

  const data = await tmdb.getDiscoverTv({ page: Number(req.query.page) });

  const resultIds = data.results.map((result) => result.id);

  const requests = await requestRepository.find({
    mediaId: In(resultIds),
  });

  return res.status(200).json({
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map((result) =>
      mapTvResult(
        result,
        requests.find((req) => req.mediaId === result.id)
      )
    ),
  });
});

export default discoverRoutes;
