import { getRepository } from 'typeorm';
import { User } from '../../entity/User';
import PlexAPI, { PlexLibraryItem } from '../../api/plexapi';
import TheMovieDb, { TmdbTvDetails } from '../../api/themoviedb';
import Media from '../../entity/Media';
import { MediaStatus, MediaType } from '../../constants/media';
import logger from '../../logger';
import { getSettings, Library } from '../../lib/settings';
import Season from '../../entity/Season';

const BUNDLE_SIZE = 10;

const imdbRegex = new RegExp(/imdb:\/\/(tt[0-9]+)/);
const tmdbRegex = new RegExp(/tmdb:\/\/([0-9]+)/);
const tvdbRegex = new RegExp(/tvdb:\/\/([0-9]+)/);
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
    if (plexitem.guid.match(plexRegex)) {
      const metadata = await this.plexClient.getMetadata(plexitem.ratingKey);
      const newMedia = new Media();

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
      const matchedid = plexitem.guid.match(/imdb:\/\/(tt[0-9]+)/);

      if (matchedid?.[1]) {
        const tmdbMovie = await this.tmdb.getMovieByImdbId({
          imdbId: matchedid[1],
        });

        const existing = await this.getExisting(tmdbMovie.id);
        if (existing && existing.status === MediaStatus.AVAILABLE) {
          this.log(`Title exists and is already available ${plexitem.title}`);
        } else if (existing && existing.status !== MediaStatus.AVAILABLE) {
          existing.status = MediaStatus.AVAILABLE;
          await mediaRepository.save(existing);
          this.log(
            `Request for ${plexitem.title} exists. Setting status AVAILABLE`,
            'info'
          );
        } else if (tmdbMovie) {
          const newMedia = new Media();
          newMedia.imdbId = tmdbMovie.external_ids.imdb_id;
          newMedia.tmdbId = tmdbMovie.id;
          newMedia.status = MediaStatus.AVAILABLE;
          newMedia.mediaType = MediaType.MOVIE;
          await mediaRepository.save(newMedia);
          this.log(`Saved ${tmdbMovie.title}`);
        }
      }
    }
  }

  private async processShow(plexitem: PlexLibraryItem) {
    const mediaRepository = getRepository(Media);

    let tvShow: TmdbTvDetails | null = null;

    try {
      const metadata = await this.plexClient.getMetadata(
        plexitem.parentRatingKey ?? plexitem.ratingKey,
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

        const availableSeasons: Season[] = [];

        seasons.forEach((season) => {
          const matchedPlexSeason = metadata.Children?.Metadata.find(
            (md) => Number(md.index) === season.season_number
          );

          // Check if we found the matching season and it has all the available episodes
          if (
            matchedPlexSeason &&
            Number(matchedPlexSeason.leafCount) === season.episode_count
          ) {
            availableSeasons.push(
              new Season({
                seasonNumber: season.season_number,
                status: MediaStatus.AVAILABLE,
              })
            );
          } else if (matchedPlexSeason) {
            availableSeasons.push(
              new Season({
                seasonNumber: season.season_number,
                status: MediaStatus.PARTIALLY_AVAILABLE,
              })
            );
          }
        });

        // Remove extras season. We dont count it for determining availability
        const filteredSeasons = tvShow.seasons.filter(
          (season) => season.season_number !== 0
        );

        const isAllSeasons = availableSeasons.length >= filteredSeasons.length;

        if (media) {
          // Update existing
          media.seasons = availableSeasons;
          media.status = isAllSeasons
            ? MediaStatus.AVAILABLE
            : MediaStatus.PARTIALLY_AVAILABLE;
          await mediaRepository.save(media);
          this.log(`Updating existing title: ${tvShow.name}`);
        } else {
          const newMedia = new Media({
            mediaType: MediaType.TV,
            seasons: availableSeasons,
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
          plexitem.parentRatingKey ?? plexitem.ratingKey
        }`,
        'error'
      );
    }
  }

  private async processItems(slicedItems: PlexLibraryItem[]) {
    await Promise.all(
      slicedItems.map(async (plexitem) => {
        if (plexitem.type === 'movie') {
          await this.processMovie(plexitem);
        } else if (plexitem.type === 'show') {
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

      await new Promise((resolve) =>
        setTimeout(async () => {
          await this.loop({
            start: start + BUNDLE_SIZE,
            end: end + BUNDLE_SIZE,
          });
          resolve();
        }, 5000)
      );
    }
  }

  private log(
    message: string,
    level: 'info' | 'error' | 'debug' = 'debug'
  ): void {
    logger[level](message, { label: 'Plex Sync' });
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
      if (this.isRecentOnly) {
        this.currentLibrary = {
          id: '0',
          name: 'Recently Added',
          enabled: true,
        };
        this.log(`Beginning to process recently added`, 'info');
        this.items = await this.plexClient.getRecentlyAdded();
        await this.loop();
      } else {
        this.libraries = settings.plex.libraries.filter(
          (library) => library.enabled
        );

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
