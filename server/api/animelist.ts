import axios from 'axios';
import xml2js from 'xml2js';
import fs, { promises as fsp } from 'fs';
import path from 'path';
import logger from '../logger';

const UPDATE_INTERVAL = 24 * 3600; // how often to download new mapping
// originally at https://raw.githubusercontent.com/ScudLee/anime-lists/master/anime-list.xml
const MAPPING_URL =
  'https://raw.githubusercontent.com/Anime-Lists/anime-lists/master/anime-list.xml';
const LOCAL_PATH = path.join(__dirname, '../../config/anime-list.xml');

const mappingRegexp = new RegExp(/;[0-9]+-([0-9]+);/);

// Anime-List xml files are community maintained mappings that Hama agent uses to map AniDB IDs to tvdb/tmdb IDs
// https://github.com/Anime-Lists/anime-lists/

export interface AnidbItem {
  tvdbId?: number;
  tmdbId?: number;
  imdbId?: string;
}

class AnimeListMapping {
  private syncing = false;

  private mapping: { [anidbId: number]: AnidbItem } = {};

  // each episode in season 0 from TVDB can map to movie (AniDB id)
  private specials: { [tvdbId: number]: { [episode: number]: number } } = {};

  public isLoaded = () => Object.keys(this.mapping).length !== 0;

  private loadFromFile = async () => {
    logger.info('Loading Anime-List mapping file');
    try {
      const file = await fsp.readFile(LOCAL_PATH);
      const xml = await xml2js.parseStringPromise(file);

      this.mapping = {};
      this.specials = {};
      for (const anime of xml['anime-list']['anime']) {
        const a = anime['$'];

        let tvdbId = a['tvdbid'];
        if (!isNaN(Number(tvdbId))) {
          tvdbId = Number(tvdbId);
        } else {
          tvdbId = undefined;
        }

        let imdbId = a['imdbid'];
        if (imdbId && !imdbId.startsWith('tt')) {
          imdbId = undefined;
        }

        const tmdbId = a['tmdbid'];
        const anidbId = Number(a['anidbid']);
        this.mapping[anidbId] = {
          tvdbId: tvdbId,
          tmdbId: tmdbId,
          imdbId: imdbId,
        };

        if (tvdbId) {
          const mappingLists = anime['mapping-list'];
          if (mappingLists) {
            for (const mappingList of mappingLists) {
              for (const mapping of mappingList['mapping']) {
                const text = mapping['_'];
                if (text && mapping['$']['tvdbseason'] == '0') {
                  const matches = text.match(mappingRegexp);
                  if (matches) {
                    const episode = Number(matches[1]);
                    if (!this.specials[tvdbId]) {
                      this.specials[tvdbId] = {};
                    }
                    this.specials[tvdbId][episode] = anidbId;
                  }
                }
              }
            }
          }
          // some movies do not have mapping-list, which means 1 episode in specials
          // matches movie itself
          if (imdbId) {
            if (
              a['defaulttvdbseason'] == '0' &&
              anime['mapping-list'] == undefined
            ) {
              if (!this.specials[tvdbId]) {
                this.specials[tvdbId] = {};
              }
              this.specials[tvdbId][1] = anidbId;
            }
          }
        }
      }
      logger.info(
        `Loaded ${
          Object.keys(this.mapping).length
        } AniDB items from Anime-List mapping file`
      );
    } catch (e) {
      throw new Error(`Failed to load anidb mappings: ${e.message}`);
    }
  };

  private downloadFile = async () => {
    logger.info('Downloading latest Anime-List mapping file');
    try {
      const response = await axios.get(MAPPING_URL, {
        responseType: 'stream',
      });
      await new Promise<void>((resolve) => {
        const writer = fs.createWriteStream(LOCAL_PATH);
        writer.on('finish', resolve);
        response.data.pipe(writer);
      });
    } catch (e) {
      throw new Error(`Failed to download AniDB mapping: ${e.message}`);
    }
  };

  public sync = async () => {
    // make sure only one sync runs at a time
    if (this.syncing) {
      return;
    }

    this.syncing = true;
    try {
      // check if local file is not "expired" yet
      if (fs.existsSync(LOCAL_PATH)) {
        const now = new Date();
        const stat = await fsp.stat(LOCAL_PATH);
        if (now.getTime() - stat.mtime.getTime() < UPDATE_INTERVAL * 1000) {
          // no neet to download, but make sure file is loaded
          if (!this.isLoaded()) {
            await this.loadFromFile();
          }
          return;
        }
      }
      await this.downloadFile();
      await this.loadFromFile();
    } finally {
      this.syncing = false;
    }
  };

  public getFromAnidbId = (anidbId: number): AnidbItem | undefined => {
    return this.mapping[anidbId];
  };

  public getSpecialEpisode = (
    tvdbId: number,
    episode: number
  ): AnidbItem | undefined => {
    const episodes = this.specials[tvdbId];
    if (!episodes) {
      return undefined;
    }
    const anidbId = episodes[episode];
    if (!anidbId) {
      return undefined;
    }
    return this.mapping[anidbId];
  };
}

const animeList = new AnimeListMapping();

export default animeList;
