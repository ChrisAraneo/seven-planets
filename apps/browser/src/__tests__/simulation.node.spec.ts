// @vitest-environment node
import '@/stores';

import { simulateGame } from '@seven-planets/game';
import { noop, times } from 'lodash-es';
import { match } from 'ts-pattern';
import { describe, expect, it } from 'vitest';

import { chain } from '@/utils/chain';

describe('headless game simulation', () => {
  it(
    'plays full AI-vs-AI games to a resolution without throwing',
    () =>
      times(20, noop).reduce(
        (prev: Promise<void>) =>
          prev
            .then(() => simulateGame())
            .then((result) =>
              chain(expect(result.turns).toBeGreaterThan(0))
                .tap(() =>
                  expect(['CONQUEST', 'timeout']).toContain(result.reason),
                )
                .tap(() =>
                  match(result.reason)
                    .with('CONQUEST', () =>
                      expect(result.winner).not.toBeNull(),
                    )
                    .otherwise(noop),
                )
                .thru(noop)
                .value(),
            ),
        Promise.resolve(),
      ),
    60_000,
  );
});
