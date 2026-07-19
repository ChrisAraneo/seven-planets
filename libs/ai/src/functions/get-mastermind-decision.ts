import type { Player } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { activateWeightsFor } from './activate-weights-for';
import { getBestAttackNow } from './get-best-attack-now';
import { getInfluencePlay } from './get-influence-play';
import { getMoveDecision } from './get-move-decision';
import { getPlan } from './get-plan';
import { getRecruitDecision } from './get-recruit-decision';
import { getTradeOffer } from './get-trade-offer';
import { hasBuilding } from './has-building';
import type { MastermindDecision } from './mastermind-decision';

export { type MastermindDecision } from './mastermind-decision';

const getInfluenceDecision = (player: Player): MastermindDecision | null =>
  match(getInfluencePlay(player))
    .with(nullish, () => null)
    .otherwise(
      (influenceDecision): MastermindDecision => ({
        kind: 'influence',
        type: influenceDecision.type,
        options: influenceDecision.options,
      }),
    );

const getAttackDecision = (player: Player): MastermindDecision | null =>
  match((player.hand.ATTACK || 0) < 1)
    .with(true, () => null)
    .otherwise(() =>
      match(getBestAttackNow(player))
        .with(nullish, () => null)
        .otherwise(
          (attackPlan): MastermindDecision => ({
            kind: 'attack',
            source: attackPlan.source,
            target: attackPlan.target,
            n: attackPlan.n,
          }),
        ),
    );

const getTradeDecision = (player: Player): MastermindDecision | null =>
  match(
    !player.hasTradedCurrentTurn &&
      (player.hand.TRADE || 0) > 0 &&
      hasBuilding(player, 'EMBASSY'),
  )
    .with(false, () => null)
    .otherwise(() =>
      match(getTradeOffer(player, getPlan(player)))
        .with(nullish, () => null)
        .otherwise(
          (offer): MastermindDecision => ({ kind: 'trade', ...offer }),
        ),
    );

export const getMastermindDecision = (
  player: Player,
): MastermindDecision | null =>
  chain(player)
    .tap(activateWeightsFor)
    .thru(
      () =>
        getInfluenceDecision(player) ??
        getAttackDecision(player) ??
        getRecruitDecision(player) ??
        getMoveDecision(player) ??
        getTradeDecision(player),
    )
    .value();
