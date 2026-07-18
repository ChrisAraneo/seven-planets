import type { Player } from '@seven-planets/game';
import { computeRecruitYield } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { computeActionDrawProbability } from './compute-action-draw-probability';
import { computeIncomePerTurn } from './compute-income-per-turn';
import { getOwnedPlanets } from './get-owned-planets';

export const computeRecruitRate = (player: Player): number =>
  chain(
    getOwnedPlanets(player).reduce(
      (best, planet) => Math.max(best, computeRecruitYield(planet)),
      0,
    ),
  )
    .thru((bestYield) =>
      match(bestYield)
        .with(0, () => 0)
        .otherwise(
          () =>
            Math.min(
              bestYield,
              Math.max(
                0,
                (computeIncomePerTurn(player).ORE || 0) +
                  (player.hand.ORE || 0) / 4,
              ),
            ) *
            match(player.hand.RECRUIT || 0)
              .when(
                (held) => held > 0,
                () => 0.9,
              )
              .otherwise(() => computeActionDrawProbability('RECRUIT')),
        ),
    )
    .value();
