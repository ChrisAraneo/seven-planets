import type { Player } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { computeSiloBonus } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { computeRecruitRate } from './compute-recruit-rate';
import { getOwnedPlanets } from './get-owned-planets';

export const computeProjectedStrike = (
  player: Player,
  turnsAhead: number,
  excludePlanetId = -1,
): { n: number; bonus: number } =>
  chain(computeRecruitRate(player) * turnsAhead)
    .thru((growth) =>
      getOwnedPlanets(player).reduce(
        (best, planet) =>
          match(planet)
            .when(
              (candidate) =>
                candidate.id !== excludePlanetId &&
                Boolean(candidate.buildings.SILO),
              (candidate) =>
                chain(
                  Math.min(
                    getRocketCapacity(candidate),
                    Math.floor(candidate.troops + growth) - 1,
                  ),
                )
                  .thru((count) =>
                    match(count > best.n)
                      .with(true, () => ({
                        n: count,
                        bonus: computeSiloBonus(candidate),
                      }))
                      .otherwise(() => best),
                  )
                  .value(),
            )
            .otherwise(() => best),
        { n: 0, bonus: 0 },
      ),
    )
    .value();
