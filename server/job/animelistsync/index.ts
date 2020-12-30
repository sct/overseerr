import animeList from '../../api/animelist';
import logger from '../../logger';

class JobAnimeListSync {
  public async run(): Promise<void> {
    try {
      await animeList.sync();
      logger.info('[AnimeList Sync] AniDB mapping sync complete');
    } catch (e) {
      logger.error(`[AnimeList Sync] AniDB mapping sync failed: ${e.message}`);
    }
  }
}

export const jobAnimeListSync = new JobAnimeListSync();
