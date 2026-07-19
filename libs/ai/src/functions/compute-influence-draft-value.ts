import type { InfluenceType, Player } from '@seven-planets/game';
import { INFLUENCE_CARDS } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeAverageStrength } from './compute-average-strength';
import { computePlayerStrength } from './compute-player-strength';
import { getBestCoupTarget } from './get-best-coup-target';
import { getSkipTarget } from './get-skip-target';
import type { Plan } from './plan-types';

const finishValue = (
  player: Player,
  influenceType: InfluenceType,
  value: number,
  starCost: number,
): number =>
  value -
  match((player.hand[influenceType] || 0) > 0)
    .with(true, () => 1.5)
    .otherwise(() => 0) -
  starCost;

const finishSkipValue = (
  player: Player,
  influenceType: InfluenceType,
  starCost: number,
): number =>
  match(getSkipTarget(player, influenceType))
    .with(nullish, () => -2)
    .otherwise((target) =>
      finishValue(
        player,
        influenceType,
        1 +
          (computePlayerStrength(target) /
            Math.max(1, computeAverageStrength())) *
            1.5,
        starCost,
      ),
    );

const canLootActionCard = (player: Player): boolean =>
  getAlivePlayers().some(
    (rival) =>
      rival.id !== player.id &&
      (['ATTACK', 'RECRUIT', 'MOVE', 'TRADE'] as const).some(
        (cardType) => (rival.hand[cardType] || 0) > 0,
      ),
  );

export const computeInfluenceDraftValue = (
  player: Player,
  influenceType: InfluenceType,
  plan: Plan,
): number =>
  chain(
    INFLUENCE_CARDS[influenceType].cost *
      match(plan.kind === 'COUP_BANK' && influenceType !== 'COUP')
        .with(true, () => 1.2)
        .otherwise(() => 0.35),
  )
    .thru((starCost) =>
      match(influenceType)
        .with('COUP', () =>
          match(getBestCoupTarget(player))
            .when(
              (coupTarget) =>
                (coupTarget?.value ?? -Infinity) >=
                getAiState().weights.coupValueFloor,
              () =>
                12 -
                match((player.hand.COUP || 0) > 0)
                  .with(true, () => 6)
                  .otherwise(() => 0),
            )
            .otherwise(() => finishValue(player, 'COUP', -2, starCost)),
        )
        .with('STEAL_ACTION', () =>
          finishValue(
            player,
            'STEAL_ACTION',
            match(canLootActionCard(player))
              .with(true, () => 1.5)
              .otherwise(() => -2),
            starCost,
          ),
        )
        .with('PEACE', () =>
          finishValue(player, 'PEACE', 1 + plan.threat * 0.4, starCost),
        )
        .otherwise(() => finishSkipValue(player, influenceType, starCost)),
    )
    .value();
