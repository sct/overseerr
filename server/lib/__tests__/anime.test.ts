import assert from 'node:assert/strict';

import { ANIME_KEYWORD_ID } from '@server/api/themoviedb/constants';
import { hasAnimeKeyword } from '@server/lib/anime';
import { selectDefaultRadarrServer } from '@server/lib/radarr';
import type { RadarrSettings } from '@server/lib/settings';

type TestCase = {
  name: string;
  run: () => void;
};

const createRadarr = (overrides: Partial<RadarrSettings>): RadarrSettings => ({
  id: 1,
  name: 'Radarr',
  hostname: 'localhost',
  port: 7878,
  apiKey: 'radarr',
  useSsl: false,
  activeProfileId: 1,
  activeProfileName: 'HD-1080p',
  activeDirectory: '/movies',
  tags: [],
  is4k: false,
  isAnime: false,
  isDefault: true,
  syncEnabled: false,
  preventSearch: false,
  tagRequests: false,
  minimumAvailability: 'released',
  ...overrides,
});

const cases: TestCase[] = [
  {
    name: 'anime movies route to anime radarr server when anime keyword is present',
    run: () => {
      const animeKeywords = [
        { id: 123, name: 'family' },
        { id: ANIME_KEYWORD_ID, name: 'Anime' },
      ];

      const radarrServers = [
        createRadarr({ id: 1, name: 'Main Radarr' }),
        createRadarr({
          id: 2,
          name: 'Anime Radarr',
          isAnime: true,
          activeAnimeDirectory: '/anime',
          activeAnimeProfileId: 2,
          animeTags: [5],
        }),
      ];

      const isAnime = hasAnimeKeyword(animeKeywords);
      const selectedServer = selectDefaultRadarrServer(radarrServers, {
        is4k: false,
        isAnime,
      });

      assert.equal(isAnime, true);
      assert.equal(selectedServer?.name, 'Anime Radarr');
    },
  },
  {
    name: 'non-anime animation does not route to anime radarr server without anime keyword',
    run: () => {
      const animatedKeywords = [
        { id: 251, name: 'penguin' },
        { id: 672, name: 'tap dancing' },
      ];

      const radarrServers = [
        createRadarr({ id: 10, name: 'Main Radarr' }),
        createRadarr({ id: 11, name: 'Anime Radarr', isAnime: true }),
      ];

      const isAnime = hasAnimeKeyword(animatedKeywords);
      const selectedServer = selectDefaultRadarrServer(radarrServers, {
        is4k: false,
        isAnime,
      });

      assert.equal(isAnime, false);
      assert.equal(selectedServer?.name, 'Main Radarr');
    },
  },
  {
    name: 'hasAnimeKeyword understands TMDB keyword containers',
    run: () => {
      const keywordList = [
        { id: 11, name: 'cats' },
        { id: ANIME_KEYWORD_ID, name: 'anime' },
      ];

      assert.equal(hasAnimeKeyword({ keywords: keywordList }), true);
      assert.equal(hasAnimeKeyword({ results: keywordList }), true);
      assert.equal(hasAnimeKeyword({ keywords: [] }), false);
      assert.equal(hasAnimeKeyword({ results: [] }), false);
    },
  },
];

let failed = false;

for (const testCase of cases) {
  try {
    testCase.run();
    process.stdout.write(`✓ ${testCase.name}\n`);
  } catch (error) {
    failed = true;
    process.stderr.write(`✗ ${testCase.name}\n`);
    process.stderr.write(
      `${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }\n`
    );
  }
}

if (failed) {
  process.exitCode = 1;
}
