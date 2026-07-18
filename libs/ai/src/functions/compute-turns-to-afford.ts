import type { Cost, Player } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { computeIncomePerTurn } from './compute-income-per-turn';

export const computeTurnsToAfford = (player: Player, cost: Cost): number =>
  chain(computeIncomePerTurn(player))
    .thru((income) =>
      Object.keys(cost).reduce(
        (acc, resourceType) =>
          match(cost[resourceType] - (player.hand[resourceType] || 0))
            .when(
              (shortfall) => shortfall <= 0,
              () => acc,
            )
            .otherwise((shortfall) =>
              chain(Math.min(Math.max(0, acc.wildcards), shortfall))
                .thru((wildcardsUsed) => ({
                  wildcards: acc.wildcards - wildcardsUsed,
                  turns: match(shortfall - wildcardsUsed)
                    .when(
                      (uncovered) => uncovered > 0,
                      (uncovered) =>
                        Math.max(
                          acc.turns,
                          uncovered / ((income[resourceType] || 0) + 0.35),
                        ),
                    )
                    .otherwise(() => acc.turns),
                }))
                .value(),
            ),
        { wildcards: (player.hand.RELIC || 0) - (cost.RELIC || 0), turns: 0 },
      ),
    )
    .thru(({ turns }) => turns)
    .value();
