import { getRepository } from 'typeorm';
import { User } from '../../entity/User';
import PlexAPI, { PlexLibraryItem } from '../../api/plexapi';
import TheMovieDb, {
  TmdbMovieDetails,
  TmdbTvDetails,
} from '../../api/themoviedb';
import Media from '../../entity/Media';
import { MediaStatus, MediaType } from '../../constants/media';
import logger from '../../logger';
import { getSettings, Library } from '../../lib/settings';
import Season from '../../entity/Season';
import { uniqWith } from 'lodash';

const BUNDLE_SIZE = 20;
const UPDATE_RATE = 4 * 1000;

const imdbRegex = new RegExp(/imdb:\/\/(tt[0-9]+)/);
const tmdbRegex = new RegExp(/tmdb:\/\/([0-9]+)/);
const tvdbRegex = new RegExp(/tvdb:\/\/([0-9]+)|hama:\/\/tvdb-([0-9]+)/);
const tmdbShowRegex = new RegExp(/themoviedb:\/\/([0-9]+)/);
const plexRegex = new RegExp(/plex:\/\//);

interface SyncStatus {
  running: boolean;
  progress: number;
  total: number;
  currentLibrary: Library;
  libraries: Library[];
}

class JobPlexSync {
  private tmdb: TheMovieDb;
  private plexClient: PlexAPI;
  private items: PlexLibraryItem[] = [];
  private progress = 0;
  private libraries: Library[];
  private currentLibrary: Library;
  private running = false;
  private isRecentOnly = false;

  constructor({ isRecentOnly }: { isRecentOnly?: boolean } = {}) {
    this.tmdb = new TheMovieDb();
    this.isRecentOnly = isRecentOnly ?? false;
  }

  private async getExisting(tmdbId: number) {
    const mediaRepository = getRepository(Media);

    const existing = await mediaRepository.findOne({
      where: { tmdbId: tmdbId },
    });

    return existing;
  }

  private async processMovie(plexitem: PlexLibraryItem) {
    const mediaRepository = getRepository(Media);
    try {
      if (plexitem.guid.match(plexRegex)) {
        const metadata = await this.plexClient.getMetadata(plexitem.ratingKey);
        const newMedia = new Media();

        if (!metadata.Guid) {
          logger.debug('No Guid metadata for this title. Skipping', {
            label: 'Plex Sync',
            ratingKey: plexitem.ratingKey,
          });
          return;
        }

        metadata.Guid.forEach((ref) => {
          if (ref.id.match(imdbRegex)) {
            newMedia.imdbId = ref.id.match(imdbRegex)?.[1] ?? undefined;
          } else if (ref.id.match(tmdbRegex)) {
            const tmdbMatch = ref.id.match(tmdbRegex)?.[1];
            newMedia.tmdbId = Number(tmdbMatch);
          }
        });

        const existing = await this.getExisting(newMedia.tmdbId);

        if (existing && existing.status === MediaStatus.AVAILABLE) {
          this.log(`Title exists and is already available ${metadata.title}`);
        } else if (existing && existing.status !== MediaStatus.AVAILABLE) {
          existing.status = MediaStatus.AVAILABLE;
          mediaRepository.save(existing);
          this.log(
            `Request for ${metadata.title} exists. Setting status AVAILABLE`,
            'info'
          );
        } else {
          newMedia.status = MediaStatus.AVAILABLE;
          newMedia.mediaType = MediaType.MOVIE;
          await mediaRepository.save(newMedia);
          this.log(`Saved ${plexitem.title}`);
        }
      } else {
        let tmdbMovieId: number | undefined;
        let tmdbMovie: TmdbMovieDetails | undefined;

        const imdbMatch = plexitem.guid.match(imdbRegex);
        const tmdbMatch = plexitem.guid.match(tmdbShowRegex);

        if (imdbMatch) {
          tmdbMovie = await this.tmdb.getMovieByImdbId({
            imdbId: imdbMatch[1],
          });
          tmdbMovieId = tmdbMovie.id;
        } else if (tmdbMatch) {
          tmdbMovieId = Number(tmdbMatch[1]);
        }

        if (!tmdbMovieId) {
          throw new Error('Unable to find TMDB ID');
        }

        const existing = await this.getExisting(tmdbMovieId);
        if (existing && existing.status === MediaStatus.AVAILABLE) {
          this.log(`Title exists and is already available ${plexitem.title}`);
        } else if (existing && existing.status !== MediaStatus.AVAILABLE) {
          existing.status = MediaStatus.AVAILABLE;
          await mediaRepository.save(existing);
          this.log(
            `Request for ${plexitem.title} exists. Setting status AVAILABLE`,
            'info'
          );
        } else {
          // If we have a tmdb movie guid but it didn't already exist, only then
          // do we request the movie from tmdb (to reduce api requests)
          if (!tmdbMovie) {
            tmdbMovie = await this.tmdb.getMovie({ movieId: tmdbMovieId });
          }
          const newMedia = new Media();
          newMedia.imdbId = tmdbMovie.external_ids.imdb_id;
          newMedia.tmdbId = tmdbMovie.id;
          newMedia.status = MediaStatus.AVAILABLE;
          newMedia.mediaType = MediaType.MOVIE;
          await mediaRepository.save(newMedia);
          this.log(`Saved ${tmdbMovie.title}`);
        }
      }
    } catch (e) {
      this.log(
        `Failed to process plex item. ratingKey: ${plexitem.ratingKey}`,
        'error',
        {
          errorMessage: e.message,
          plexitem,
        }
      );
    }
  }

  private async processShow(plexitem: PlexLibraryItem) {
    const mediaRepository = getRepository(Media);

    let tvShow: TmdbTvDetails | null = null;

    try {
      const metadata = await this.plexClient.getMetadata(
        plexitem.grandparentRatingKey ??
          plexitem.parentRatingKey ??
          plexitem.ratingKey,
        { includeChildren: true }
      );
      if (metadata.guid.match(tvdbRegex)) {
        const matchedtvdb = metadata.guid.match(tvdbRegex);

        // If we can find a tvdb Id, use it to get the full tmdb show details
        if (matchedtvdb?.[1]) {
          tvShow = await this.tmdb.getShowByTvdbId({
            tvdbId: Number(matchedtvdb[1]),
          });
        }
      } else if (metadata.guid.match(tmdbShowRegex)) {
        const matchedtmdb = metadata.guid.match(tmdbShowRegex);

        if (matchedtmdb?.[1]) {
          tvShow = await this.tmdb.getTvShow({ tvId: Number(matchedtmdb[1]) });
        }
      }

      if (tvShow && metadata) {
        // Lets get the available seasons from plex
        const seasons = tvShow.seasons;
        const media = await mediaRepository.findOne({
          where: { tmdbId: tvShow.id, mediaType: MediaType.TV },
        });

        const newSeasons: Season[] = [];

        const currentSeasonAvailable = (
          media?.seasons.filter(
            (season) => season.status === MediaStatus.AVAILABLE
          ) ?? []
        ).length;

        seasons.forEach((season) => {
          const matchedPlexSeason = metadata.Children?.Metadata.find(
            (md) => Number(md.index) === season.season_number
          );

          const existingSeason = media?.seasons.find(
            (es) => es.seasonNumber === season.season_number
          );

          // Check if we found the matching season and it has all the available episodes
          if (
            matchedPlexSeason &&
            Number(matchedPlexSeason.leafCount) === season.episode_count
          ) {
            if (existingSeason) {
              existingSeason.status = MediaStatus.AVAILABLE;
            } else {
              newSeasons.push(
                new Season({
                  seasonNumber: season.season_number,
                  status: MediaStatus.AVAILABLE,
                })
              );
            }
          } else if (matchedPlexSeason) {
            if (existingSeason) {
              existingSeason.status = MediaStatus.PARTIALLY_AVAILABLE;
            } else {
              newSeasons.push(
                new Season({
                  seasonNumber: season.season_number,
                  status: MediaStatus.PARTIALLY_AVAILABLE,
                })
              );
            }
          }
        });

        // Remove extras season. We dont count it for determining availability
        const filteredSeasons = tvShow.seasons.filter(
          (season) => season.season_number !== 0
        );

        const isAllSeasons =
          newSeasons.length + (media?.seasons.length ?? 0) >=
          filteredSeasons.length;

        if (media) {
          // Update existing
          media.seasons = [...media.seasons, ...newSeasons];

          const newSeasonAvailable = (
            media.seasons.filter(
              (season) => season.status === MediaStatus.AVAILABLE
            ) ?? []
          ).length;

          // If at least one new season has become available, update
          // the lastSeasonChange field so we can trigger notifications
          if (newSeasonAvailable > currentSeasonAvailable) {
            this.log(
              `Detected ${
                newSeasonAvailable - currentSeasonAvailable
              } new season(s) for ${tvShow.name}`,
              'debug'
            );
            media.lastSeasonChange = new Date();
          }

          media.status = isAllSeasons
            ? MediaStatus.AVAILABLE
            : MediaStatus.PARTIALLY_AVAILABLE;
          await mediaRepository.save(media);
          this.log(`Updating existing title: ${tvShow.name}`);
        } else {
          const newMedia = new Media({
            mediaType: MediaType.TV,
            seasons: newSeasons,
            tmdbId: tvShow.id,
            tvdbId: tvShow.external_ids.tvdb_id,
            status: isAllSeasons
              ? MediaStatus.AVAILABLE
              : MediaStatus.PARTIALLY_AVAILABLE,
          });
          await mediaRepository.save(newMedia);
          this.log(`Saved ${tvShow.name}`);
        }
      } else {
        this.log(`failed show: ${plexitem.guid}`);
      }
    } catch (e) {
      this.log(
        `Failed to process plex item. ratingKey: ${
          plexitem.grandparentRatingKey ??
          plexitem.parentRatingKey ??
          plexitem.ratingKey
        }`,
        'error',
        {
          errorMessage: e.message,
          plexitem,
        }
      );
    }
  }

  private async processItems(slicedItems: PlexLibraryItem[]) {
    await Promise.all(
      slicedItems.map(async (plexitem) => {
        if (plexitem.type === 'movie') {
          await this.processMovie(plexitem);
        } else if (
          plexitem.type === 'show' ||
          plexitem.type === 'episode' ||
          plexitem.type === 'season'
        ) {
          await this.processShow(plexitem);
        }
      })
    );
  }

  private async loop({
    start = 0,
    end = BUNDLE_SIZE,
  }: {
    start?: number;
    end?: number;
  } = {}) {
    const slicedItems = this.items.slice(start, end);
    if (start < this.items.length && this.running) {
      this.progress = start;
      await this.processItems(slicedItems);

      await new Promise<void>((resolve) =>
        setTimeout(async () => {
          await this.loop({
            start: start + BUNDLE_SIZE,
            end: end + BUNDLE_SIZE,
          });
          resolve();
        }, UPDATE_RATE)
      );
    }
  }

  private log(
    message: string,
    level: 'info' | 'error' | 'debug' = 'debug',
    optional?: Record<string, unknown>
  ): void {
    logger[level](message, { label: 'Plex Sync', ...optional });
  }

  public async run(): Promise<void> {
    const settings = getSettings();
    if (!this.running) {
      this.running = true;
      const userRepository = getRepository(User);
      const admin = await userRepository.findOneOrFail({
        select: ['id', 'plexToken'],
        order: { id: 'ASC' },
      });

      this.plexClient = new PlexAPI({ plexToken: admin.plexToken });

      this.libraries = settings.plex.libraries.filter(
        (library) => library.enabled
      );

      if (this.isRecentOnly) {
        for (const library of this.libraries) {
          this.currentLibrary = library;
          this.log(
            `Beginning to process recently added for library: ${library.name}`,
            'info'
          );
          const libraryItems = await this.plexClient.getRecentlyAdded(
            library.id
          );

          // Bundle items up by rating keys
          this.items = uniqWith(libraryItems, (mediaA, mediaB) => {
            if (mediaA.grandparentRatingKey && mediaB.grandparentRatingKey) {
              return (
                mediaA.grandparentRatingKey === mediaB.grandparentRatingKey
              );
            }

            if (mediaA.parentRatingKey && mediaB.parentRatingKey) {
              return mediaA.parentRatingKey === mediaB.parentRatingKey;
            }

            return mediaA.ratingKey === mediaB.ratingKey;
          });

          await this.loop();
        }
      } else {
        for (const library of this.libraries) {
          this.currentLibrary = library;
          this.log(`Beginning to process library: ${library.name}`, 'info');
          this.items = await this.plexClient.getLibraryContents(library.id);
          await this.loop();
        }
      }
      this.running = false;
      this.log('complete');
    }
  }

  public status(): SyncStatus {
    return {
      running: this.running,
      progress: this.progress,
      total: this.items.length,
      currentLibrary: this.currentLibrary,
      libraries: this.libraries,
    };
  }

  public cancel(): void {
    this.running = false;
  }
}

export const jobPlexFullSync = new JobPlexSync();
export const jobPlexRecentSync = new JobPlexSync({ isRecentOnly: true });
