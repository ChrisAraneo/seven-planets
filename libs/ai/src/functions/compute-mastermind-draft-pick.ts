import type { Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { activateWeightsFor } from './activate-weights-for';
import { computeDenialValue } from './compute-denial-value';
import { computeOwnDraftValue } from './compute-own-draft-value';
import { getPlan } from './get-plan';

const pickRandomIndex = (pickable: boolean[]): number =>
  chain(
    getGameStateLastValue()
      .pool.map((_, index) => index)
      .filter((index) => pickable[index]),
  )
    .thru((options) =>
      match(options.length)
        .with(0, () => -1)
        .otherwise(() => options[Math.floor(Math.random() * options.length)]),
    )
    .value();

const pickBestIndex = (
  player: Player,
  draftPlanet: Planet,
  pickable: boolean[],
): number =>
  chain({
    aiState: getAiState(),
    plan: getPlan(player),
    pool: getGameStateLastValue().pool,
  })
    .thru(({ aiState, plan, pool }) =>
      pool.reduce(
        (best, poolType, index) =>
          match(pickable[index])
            .with(true, () =>
              chain(
                computeOwnDraftValue(player, draftPlanet, poolType, plan) +
                  (computeDenialValue(player, poolType) /
                    pool.filter((eachPoolType) => eachPoolType === poolType)
                      .length) *
                    aiState.W.denialWeight +
                  Math.random() * 0.05,
              )
                .thru((score) =>
                  match(score > best.score)
                    .with(true, () => ({ index, score }))
                    .otherwise(() => best),
                )
                .value(),
            )
            .otherwise(() => best),
        { index: -1, score: -Infinity },
      ),
    )
    .thru(({ index, score }) =>
      match(score < -1)
        .with(true, () => -1)
        .otherwise(() => index),
    )
    .value();

export const computeMastermindDraftPick = (
  player: Player,
  draftPlanet: Planet,
  pickable: boolean[],
): number =>
  chain(getAiState())
    .tap(() => activateWeightsFor(player))
    .thru((aiState) =>
      match(
        aiState.randomPickChance > 0 &&
          Math.random() < aiState.randomPickChance,
      )
        .with(true, () =>
          match(pickRandomIndex(pickable))
            .with(-1, () => pickBestIndex(player, draftPlanet, pickable))
            .otherwise((randomIndex) => randomIndex),
        )
        .otherwise(() => pickBestIndex(player, draftPlanet, pickable)),
    )
    .value();
