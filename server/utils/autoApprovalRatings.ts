import TheMovieDb from '@server/api/themoviedb';
import { MediaType } from '@server/constants/media';
import type { UserSettings } from '@server/entity/UserSettings';
import logger from '@server/logger';

interface AutoApprovalDecision {
  shouldAutoApprove: boolean;
  shouldAutoDecline: boolean;
  rating?: number;
  reason?: string;
}

/**
 * Check if media should be auto-approved or auto-declined based on TMDB rating settings
 */
async function checkMediaAutoApprovalByRating(
  tmdbId: number,
  mediaType: MediaType,
  is4k: boolean,
  userSettings: UserSettings
): Promise<AutoApprovalDecision> {
  try {
    // Get media details and rating from TMDB
    const tmdb = new TheMovieDb();
    const media =
      mediaType === MediaType.MOVIE
        ? await tmdb.getMovie({ movieId: tmdbId })
        : await tmdb.getTvShow({ tvId: tmdbId });

    if (!media.vote_average || media.vote_count < 10) {
      const mediaTypeLabel =
        mediaType === MediaType.MOVIE ? 'Movie' : 'TV show';
      logger.debug(
        `${mediaTypeLabel} has insufficient rating data, skipping rating-based auto-approval`,
        {
          label: 'Auto Approval',
          tmdbId,
          voteAverage: media.vote_average,
          voteCount: media.vote_count,
        }
      );
      return { shouldAutoApprove: false, shouldAutoDecline: false };
    }

    const rating = media.vote_average;

    // Get the appropriate thresholds based on media type and 4K status
    const prefix = mediaType === MediaType.MOVIE ? 'movie' : 'tv';
    const qualitySuffix = is4k ? '4k' : '';
    const minRatingKey =
      `${prefix}Tmdb${qualitySuffix}MinRating` as keyof UserSettings;
    const maxRatingKey =
      `${prefix}Tmdb${qualitySuffix}MaxRating` as keyof UserSettings;

    const minRating = userSettings[minRatingKey] as number | undefined;
    const maxRating = userSettings[maxRatingKey] as number | undefined;

    const mediaTypeLabel = mediaType === MediaType.MOVIE ? 'movie' : 'TV show';
    logger.debug(`Checking ${mediaTypeLabel} auto-approval by TMDB rating`, {
      label: 'Auto Approval',
      tmdbId,
      rating,
      minRating,
      maxRating,
      is4k,
      voteCount: media.vote_count,
    });

    // Check for auto-decline (rating at or below maximum threshold)
    if (maxRating !== undefined && rating <= maxRating) {
      return {
        shouldAutoApprove: false,
        shouldAutoDecline: true,
        rating,
        reason: `TMDB rating ${rating} is at or below decline threshold of ${maxRating}`,
      };
    }

    // Check for auto-approve (rating above minimum threshold)
    if (minRating !== undefined && rating >= minRating) {
      return {
        shouldAutoApprove: true,
        shouldAutoDecline: false,
        rating,
        reason: `TMDB rating ${rating} meets approval threshold ${minRating}`,
      };
    }

    return { shouldAutoApprove: false, shouldAutoDecline: false, rating };
  } catch (error) {
    const mediaTypeLabel = mediaType === MediaType.MOVIE ? 'movie' : 'TV show';
    logger.warn(`Error checking ${mediaTypeLabel} auto-approval by rating`, {
      label: 'Auto Approval',
      tmdbId,
      error: error.message,
    });
    return { shouldAutoApprove: false, shouldAutoDecline: false };
  }
}

/**
 * Check if a movie should be auto-approved or auto-declined based on TMDB rating settings
 * @deprecated Use checkMediaAutoApprovalByRating instead
 */
export async function checkMovieAutoApprovalByRating(
  tmdbId: number,
  is4k: boolean,
  userSettings: UserSettings
): Promise<AutoApprovalDecision> {
  return checkMediaAutoApprovalByRating(
    tmdbId,
    MediaType.MOVIE,
    is4k,
    userSettings
  );
}

/**
 * Check if a TV show should be auto-approved or auto-declined based on TMDB rating settings
 * @deprecated Use checkMediaAutoApprovalByRating instead
 */
export async function checkTvAutoApprovalByRating(
  tmdbId: number,
  is4k: boolean,
  userSettings: UserSettings
): Promise<AutoApprovalDecision> {
  return checkMediaAutoApprovalByRating(
    tmdbId,
    MediaType.TV,
    is4k,
    userSettings
  );
}

/**
 * Main function to check auto-approval based on ratings
 */
export async function checkAutoApprovalByRating(
  tmdbId: number,
  mediaType: MediaType,
  is4k: boolean,
  userSettings?: UserSettings
): Promise<AutoApprovalDecision> {
  // Skip if no user settings or no rating settings are configured
  if (!userSettings) {
    return { shouldAutoApprove: false, shouldAutoDecline: false };
  }

  // Check if there are any rating thresholds configured for this media type and quality
  const prefix = mediaType === MediaType.MOVIE ? 'movie' : 'tv';
  const qualitySuffix = is4k ? '4k' : '';
  const minRatingKey =
    `${prefix}Tmdb${qualitySuffix}MinRating` as keyof UserSettings;
  const maxRatingKey =
    `${prefix}Tmdb${qualitySuffix}MaxRating` as keyof UserSettings;

  const hasMinThreshold = userSettings[minRatingKey] !== undefined;
  const hasMaxThreshold = userSettings[maxRatingKey] !== undefined;

  if (!hasMinThreshold && !hasMaxThreshold) {
    return { shouldAutoApprove: false, shouldAutoDecline: false };
  }

  return checkMediaAutoApprovalByRating(tmdbId, mediaType, is4k, userSettings);
}
