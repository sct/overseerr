import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import PlexAPI, { PlexLibraryItem } from '../api/plexapi';
import TheMovieDb from '../api/themoviedb';
import Media from '../entity/Media';
import { MediaStatus, MediaType } from '../constants/media';
import logger from '../logger';
import { getSettings, Library } from '../lib/settings';

const BUNDLE_SIZE = 10;

const imdbRegex = new RegExp(/imdb:\/\/(tt[0-9]+)/);
const tmdbRegex = new RegExp(/tmdb:\/\/([0-9]+)/);
const plexRegex = new RegExp(/plex:\/\//);

export interface SyncStatus {
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

  constructor() {
    this.tmdb = new TheMovieDb();
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
          `Request for ${metadata.title} exists. Setting status AVAILABLE`
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
            `Request for ${plexitem.title} exists. Setting status AVAILABLE`
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

  private async processItems(slicedItems: PlexLibraryItem[]) {
    await Promise.all(
      slicedItems.map(async (plexitem) => {
        if (plexitem.type === 'movie') {
          await this.processMovie(plexitem);
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

  private log(message: string): void {
    logger.info(message, { label: 'Plex Sync' });
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

      for (const library of this.libraries) {
        this.currentLibrary = library;
        this.log(`Beginning to process library: ${library.name}`);
        this.items = await this.plexClient.getLibraryContents(library.id);
        await this.loop();
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

const jobPlexSync = new JobPlexSync();

export default jobPlexSync;
