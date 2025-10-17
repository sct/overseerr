import assert from 'node:assert/strict';

import { getEpisodeAirDate } from '../sonarrEpisodeDate';

type Episode = Parameters<typeof getEpisodeAirDate>[0];

const expectEqual = (actual: unknown, expected: unknown, message: string) => {
  assert.deepEqual(actual, expected, message);
};

const expectUndefined = (actual: unknown, message: string) => {
  assert.equal(actual, undefined, message);
};

const validDate = '2024-03-15T12:00:00Z';
const sentinelDate = '0001-01-01T00:00:00Z';

const buildEpisode = (overrides: Partial<Episode>): Episode => ({
  airDateUtc: undefined,
  airDate: undefined,
  ...overrides,
});

const parsedValidDate = Date.parse(validDate);

expectEqual(
  getEpisodeAirDate(buildEpisode({ airDateUtc: validDate })),
  parsedValidDate,
  'returns parsed timestamp when airDateUtc is valid'
);

expectEqual(
  getEpisodeAirDate(buildEpisode({ airDate: validDate })),
  parsedValidDate,
  'uses airDate when airDateUtc is missing'
);

expectUndefined(
  getEpisodeAirDate(buildEpisode({ airDateUtc: sentinelDate })),
  'normalizes sentinel airDateUtc values to undefined'
);

expectUndefined(
  getEpisodeAirDate(buildEpisode({ airDate: sentinelDate })),
  'normalizes sentinel airDate values to undefined'
);

expectUndefined(
  getEpisodeAirDate(buildEpisode({ airDateUtc: '0000-05-01T00:00:00Z' })),
  'treats year 0 as undefined'
);

expectUndefined(
  getEpisodeAirDate(buildEpisode({ airDateUtc: 'invalid-date' })),
  'returns undefined when date cannot be parsed'
);

expectUndefined(
  getEpisodeAirDate(buildEpisode({})),
  'returns undefined when no air date data is provided'
);

console.log('sonarrEpisodeDate tests passed');
