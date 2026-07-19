import { assign, chain } from 'lodash-es';
import { match } from 'ts-pattern';

import { emitEffect } from '../../../functions/emit-effect';
import type { GameState } from '../../../interfaces/game-state';
import { conquerPlanet } from './conquer-planet';
import type { BattleContext } from './resolve-battle';

export const applyOutcome = (
  state: GameState,
  eachBattle: BattleContext,
  attackerId: number,
  targetId: number,
  troops: number,
): void =>
  match(eachBattle)
    .when(
      ({ didWin, target }) => didWin && target.troops <= 0,
      ({ attLoss }) =>
        conquerPlanet(state, attackerId, targetId, troops - attLoss),
    )
    .when(
      ({ didWin }) => didWin,
      ({ source, target, attLoss }) =>
        void chain(
          assign(source, { troops: source.troops + (troops - attLoss) }),
        )
          .tap(() =>
            assign(
              state,
              emitEffect(state, {
                kind: 'floatText',
                planetId: target.id,
                text: 'RAIDED!',
                color: '#ff8a97',
              }),
            ),
          )
          .value(),
    )
    .otherwise(
      ({ source, target, attLoss }) =>
        void chain(
          assign(source, { troops: source.troops + (troops - attLoss) }),
        )
          .tap(() =>
            assign(
              state,
              emitEffect(state, {
                kind: 'floatText',
                planetId: target.id,
                text: 'DEFENDED!',
                color: '#7dff8a',
              }),
            ),
          )
          .value(),
    );
