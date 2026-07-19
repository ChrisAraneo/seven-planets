import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { ACTION_CARDS_FROM_TURN, INFLUENCE_CARDS } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeInfluenceIncome } from './compute-influence-income';
import { getBestCoupTarget } from './get-best-coup-target';
import { getOwnedPlanets } from './get-owned-planets';

export const computeCoupBankScore = (player: Player, threat: number): number =>
  match(getBestCoupTarget(player))
    .with(nullish, () => 0)
    .when(
      () => getTurn() < ACTION_CARDS_FROM_TURN,
      () => 0,
    )
    .otherwise((coupTarget) =>
      chain({
        coupCost: INFLUENCE_CARDS.COUP.cost,
        starIncome: computeInfluenceIncome(player),
      })
        .thru(({ coupCost, starIncome }) => ({
          coupCost,
          turnsToCoup: match(player.influence >= coupCost)
            .with(true, () => 0)
            .otherwise(() =>
              match(starIncome > 0.05)
                .with(true, () => (coupCost - player.influence) / starIncome)
                .otherwise(() => 99),
            ),
        }))
        .thru(
          ({ coupCost, turnsToCoup }) =>
            match(turnsToCoup <= getAiState().weights.planHorizon * 2)
              .with(false, () => 0)
              .otherwise(() => coupTarget.value * 0.92 ** turnsToCoup * 0.8) *
            match(player.influence < coupCost)
              .with(false, () => 1)
              .otherwise(
                () =>
                  match(getOwnedPlanets(player).length <= 1)
                    .with(true, () => 0.35)
                    .otherwise(() => 1) * Math.max(0.3, 1 - threat * 0.08),
              ),
        )
        .value(),
    );
