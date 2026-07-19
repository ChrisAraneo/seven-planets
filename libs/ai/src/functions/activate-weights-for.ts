import type { Player } from '@seven-planets/game';
import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { chain } from '../utils/chain';

export const activateWeightsFor = (player: Player): void =>
  chain(getAiState())
    .tap((aiState) =>
      match(aiState.difficulty)
        .when(
          (difficulty) => Boolean(difficulty) && !player.isHuman,
          (difficulty) =>
            assign(aiState, {
              W: {
                ...aiState.tuned,
                planHorizon: Math.max(
                  1,
                  aiState.tuned.planHorizon +
                    (difficulty?.planHorizonDelta ?? 0),
                ),
                minConquerProb:
                  aiState.tuned.minConquerProb *
                  (difficulty?.minConquerProbMult ?? 1),
                denialWeight:
                  aiState.tuned.denialWeight *
                  (difficulty?.denialWeightMult ?? 1),
              },
              randomPickChance: Math.max(
                0,
                Math.min(1, difficulty?.randomPickChance ?? 0),
              ),
            }),
        )
        .otherwise(() =>
          assign(aiState, { W: aiState.tuned, randomPickChance: 0 }),
        ),
    )
    .thru(noop)
    .value();
