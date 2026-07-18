import type { Cost, Player } from '@seven-planets/game';
import { canAfford, CARDS } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { activateWeightsFor } from './activate-weights-for';
import { computeAverageStrength } from './compute-average-strength';
import { computeHandAfterCost } from './compute-hand-after-cost';
import { computePlayerStrength } from './compute-player-strength';
import type { BuildCandidate } from './get-build-candidates';
import { getPlan } from './get-plan';

const computeValueIn = (
  aiPlayer: Player,
  gets: Cost,
  head: BuildCandidate | undefined,
): number =>
  Object.entries(gets).reduce(
    (sum, [resourceType, amount]) =>
      sum +
      amount *
        CARDS[resourceType].value *
        match(
          (head?.cost[resourceType] || 0) > (aiPlayer.hand[resourceType] || 0),
        )
          .with(true, () => 1.35)
          .otherwise(() => 1),
    0,
  );

const wouldBlockGoal = (
  aiPlayer: Player,
  head: BuildCandidate | undefined,
  gives: Cost,
  gets: Cost,
): boolean =>
  match(head)
    .with(nullish, () => false)
    .when(
      (candidate) => !canAfford(aiPlayer.hand, candidate.cost),
      () => false,
    )
    .otherwise(
      (candidate) =>
        !canAfford(
          Object.entries(gets).reduce<Cost>(
            (acc, [resourceType, amount]) => ({
              ...acc,
              [resourceType]: (acc[resourceType] || 0) + amount,
            }),
            { ...computeHandAfterCost(aiPlayer.hand, gives) },
          ),
          candidate.cost,
        ),
    );

export const shouldMastermindAcceptTrade = (
  aiPlayer: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null,
): boolean =>
  chain(aiPlayer)
    .tap(() => activateWeightsFor(aiPlayer))
    .thru(() => getPlan(aiPlayer).buildQueue.at(0))
    .thru((head) => ({
      valueIn: computeValueIn(aiPlayer, gets, head),
      valueOut:
        Object.entries(gives).reduce(
          (sum, [resourceType, amount]) =>
            sum + amount * CARDS[resourceType].value,
          0,
        ) *
        match(wouldBlockGoal(aiPlayer, head, gives, gets))
          .with(true, () => 1.6)
          .otherwise(() => 1),
    }))
    .thru(({ valueIn, valueOut }) =>
      match(proposer)
        .when(
          (candidate) =>
            candidate !== null &&
            candidate.id !== aiPlayer.id &&
            computePlayerStrength(candidate) > computeAverageStrength() * 1.25,
          () => valueIn >= valueOut * 1.5,
        )
        .otherwise(() => valueIn >= valueOut * getAiState().W.tradeAcceptRatio),
    )
    .value();
