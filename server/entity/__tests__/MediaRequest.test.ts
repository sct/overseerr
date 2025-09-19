import assert from 'node:assert/strict';

import { resolveRequestedSeasonNumbers } from '@server/entity/MediaRequest';

type TestCase = {
  name: string;
  run: () => void;
};

const cases: TestCase[] = [
  {
    name: 'filters season 0 when requesting all seasons and specials are disabled',
    run: () => {
      const result = resolveRequestedSeasonNumbers(
        'all',
        [
          { season_number: 0 },
          { season_number: 1 },
          { season_number: 2 },
        ],
        false
      );

      assert.deepStrictEqual(result, [1, 2]);
    },
  },
  {
    name: 'filters season 0 from explicit season array when specials are disabled',
    run: () => {
      const result = resolveRequestedSeasonNumbers([0, 1, 2], [], false);

      assert.deepStrictEqual(result, [1, 2]);
    },
  },
  {
    name: 'includes season 0 when specials are enabled',
    run: () => {
      const tmdbSeasons = [
        { season_number: 0 },
        { season_number: 1 },
      ];

      const resultFromAll = resolveRequestedSeasonNumbers('all', tmdbSeasons, true);
      const resultFromArray = resolveRequestedSeasonNumbers([0, 2], tmdbSeasons, true);

      assert.deepStrictEqual(resultFromAll, [0, 1]);
      assert.deepStrictEqual(resultFromArray, [0, 2]);
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
      `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`
    );
  }
}

if (failed) {
  process.exitCode = 1;
}
