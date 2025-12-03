import TheMovieDb from '@server/api/themoviedb';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import UserFavorite from '@server/entity/UserFavorite';
import type { MovieResult, TvResult } from '@server/models/Search';
import {
    mapMovieDetailsToResult,
    mapMovieResult,
    mapTvDetailsToResult,
    mapTvResult,
} from '@server/models/Search';
import logger from '@server/logger';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const FavoriteBodySchema = z.object({
    tmdbId: z.number(),
    mediaType: z.enum([MediaType.MOVIE, MediaType.TV]),
});

router.get<unknown, { page: number; totalPages: number; totalResults: number; results: (MovieResult | TvResult)[] }>(
    '/',
    async (req, res, next) => {
        try {
            const favoriteRepository = getRepository(UserFavorite);
            const pageSize = req.query.take ? Number(req.query.take) : 20;
            const page = req.query.page ? Number(req.query.page) : 1;
            const skip = (page - 1) * pageSize;

            const [favorites, favoritesCount] = await favoriteRepository.findAndCount({
                where: { user: { id: req.user?.id } },
                take: pageSize,
                skip,
                order: { createdAt: 'DESC' },
                relations: { user: true },
            });

            if (!favorites.length) {
                return res.status(200).json({
                    page,
                    totalPages: 1,
                    totalResults: 0,
                    results: [],
                });
            }

            const tmdb = new TheMovieDb({
                region: req.user?.settings?.region,
                originalLanguage: req.user?.settings?.originalLanguage,
            });

            const tmdbIds = favorites.map((fav) => fav.tmdbId);
            const media = await Media.getRelatedMedia(tmdbIds);

            const results: (MovieResult | TvResult)[] = [];

            for (const favorite of favorites) {
                try {
                    if (favorite.mediaType === MediaType.MOVIE) {
                        const details = await tmdb.getMovie({
                            movieId: favorite.tmdbId,
                            language: req.locale,
                        });
                        const mappedDetails = mapMovieDetailsToResult(details);
                        results.push(
                            mapMovieResult(
                                mappedDetails,
                                media.find(
                                    (m) =>
                                        m.tmdbId === favorite.tmdbId &&
                                        m.mediaType === MediaType.MOVIE
                                )
                            )
                        );
                    } else if (favorite.mediaType === MediaType.TV) {
                        const details = await tmdb.getTvShow({
                            tvId: favorite.tmdbId,
                            language: req.locale,
                        });
                        const mappedDetails = mapTvDetailsToResult(details);
                        results.push(
                            mapTvResult(
                                mappedDetails,
                                media.find(
                                    (m) =>
                                        m.tmdbId === favorite.tmdbId &&
                                        m.mediaType === MediaType.TV
                                )
                            )
                        );
                    }
                } catch (e) {
                    logger.debug('Failed to retrieve TMDB details for favorite', {
                        label: 'API',
                        errorMessage: e.message,
                        tmdbId: favorite.tmdbId,
                        mediaType: favorite.mediaType,
                    });
                }
            }

            return res.status(200).json({
                page,
                totalPages: Math.max(1, Math.ceil(favoritesCount / pageSize)),
                totalResults: favoritesCount,
                results,
            });
        } catch (e) {
            logger.error('Something went wrong fetching favorites', {
                label: 'API',
                errorMessage: e.message,
            });
            return next({
                status: 500,
                message: 'Unable to retrieve favorites.',
            });
        }
    }
);

router.get<{ mediaType: MediaType; tmdbId: string }, { isFavorite: boolean }>(
    '/:mediaType/:tmdbId',
    async (req, res, next) => {
        try {
            const favoriteRepository = getRepository(UserFavorite);

            const favorite = await favoriteRepository.findOne({
                where: {
                    user: { id: req.user?.id },
                    mediaType: req.params.mediaType,
                    tmdbId: Number(req.params.tmdbId),
                },
                relations: { user: true },
            });

            return res.status(200).json({ isFavorite: !!favorite });
        } catch (e) {
            logger.error('Something went wrong checking favorite status', {
                label: 'API',
                errorMessage: e.message,
            });
            return next({
                status: 500,
                message: 'Unable to check favorite status.',
            });
        }
    }
);

router.post<{ mediaType: MediaType; tmdbId: string }, UserFavorite>(
    '/:mediaType/:tmdbId',
    async (req, res, next) => {
        try {
            const favoriteRepository = getRepository(UserFavorite);

            const tmdbId = Number(req.params.tmdbId);
            const mediaType = req.params.mediaType as MediaType;

            const existing = await favoriteRepository.findOne({
                where: {
                    user: { id: req.user?.id },
                    tmdbId,
                    mediaType,
                },
                relations: { user: true },
            });

            if (existing) {
                return res.status(200).json(existing);
            }

            const favorite = new UserFavorite();
            favorite.tmdbId = tmdbId;
            favorite.mediaType = mediaType;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            favorite.user = req.user!;

            await favoriteRepository.save(favorite);

            return res.status(201).json(favorite);
        } catch (e) {
            logger.error('Something went wrong adding a favorite', {
                label: 'API',
                errorMessage: e.message,
            });
            return next({
                status: 500,
                message: 'Unable to add favorite.',
            });
        }
    }
);

router.delete<{ mediaType: MediaType; tmdbId: string }>(
    '/:mediaType/:tmdbId',
    async (req, res, next) => {
        try {
            const favoriteRepository = getRepository(UserFavorite);

            const favorite = await favoriteRepository.findOne({
                where: {
                    user: { id: req.user?.id },
                    mediaType: req.params.mediaType,
                    tmdbId: Number(req.params.tmdbId),
                },
                relations: { user: true },
            });

            if (!favorite) {
                return res.status(404).send();
            }

            await favoriteRepository.remove(favorite);

            return res.status(204).send();
        } catch (e) {
            logger.error('Something went wrong removing a favorite', {
                label: 'API',
                errorMessage: e.message,
            });
            return next({
                status: 500,
                message: 'Unable to remove favorite.',
            });
        }
    }
);

export default router;


