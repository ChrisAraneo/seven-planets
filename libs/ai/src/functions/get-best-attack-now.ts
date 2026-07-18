import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { computeEffectiveMinimumConquerProbability } from './compute-effective-minimum-conquer-probability';
import type { AttackPlan } from './get-attack-plans';
import { getAttackPlans } from './get-attack-plans';

export const getBestAttackNow = (player: Player): AttackPlan | null =>
  match((player.hand.ATTACK || 0) < 1)
    .with(true, () => null)
    .otherwise(() =>
      chain({
        minimumHold: Math.max(
          match(player.isKamikaze)
            .with(true, () => 0.01)
            .otherwise(() => 0.2),
          getAiState().W.minHoldProb *
            match(player.isKamikaze)
              .with(true, () => 0.15)
              .otherwise(() => 1) -
            getTurn() * getAiState().W.aggressionRamp * 0.5,
        ),
        raidScoreFloor: match(player.isKamikaze)
          .with(true, () => 0)
          .otherwise(() => 2),
      })
        .thru(
          ({ minimumHold, raidScoreFloor }) =>
            getAttackPlans(player)
              .filter((plan) => plan.score > 0)
              .find((plan) =>
                match(plan.willConquer)
                  .with(
                    true,
                    () =>
                      plan.pWin >=
                        computeEffectiveMinimumConquerProbability(player) &&
                      plan.holdProb >= minimumHold,
                  )
                  .otherwise(() => plan.score > raidScoreFloor),
              ) ?? null,
        )
        .value(),
    );
