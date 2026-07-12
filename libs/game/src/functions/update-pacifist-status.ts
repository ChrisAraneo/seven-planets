import { chain } from 'lodash-es';
import { match } from 'ts-pattern';
import {
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  PACIFIST_TURNS,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { emitEffect } from './emit-effect';
import { log } from './log';
import { ownedPlanets } from './owned-planets';
import { updatePlayer } from './update-player';

// Promote any player who has gone PACIFIST_TURNS without attacking. A player who
// Has once broken a pacifist vow (pacifismForfeited) can never be promoted again.
export function updatePacifistStatus(state: GameState): GameState {
  return state.players.reduce(
    (eachState, player) => promoteIfVowKept(eachState, player, state.turn),
    state,
  );
}

function promoteIfVowKept(
  state: GameState,
  player: Player,
  turn: number,
): GameState {
  return match(player)
    .when(
      (player) =>
        !player.isAlive || player.hasPacifistStatus || player.pacifismForfeited,
      () => state,
    )
    .when(
      (player) => turn - player.lastAttackTurn < PACIFIST_TURNS,
      () => state,
    )
    .otherwise((player) =>
      chain(
        updatePlayer(state, player.id, (player) => ({
          ...player,
          hasPacifistStatus: true,
        })),
      )
        .thru((promoted) =>
          log(
            promoted,
            `☮️ ${player.name} has forsworn war for ${PACIFIST_TURNS} turns and becomes a PACIFIST — every planet gains +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per turn. Attacking would break the vow for good.`,
            'sys',
          ),
        )
        .thru((logged) =>
          ownedPlanets(logged, player).reduce(
            (eachState, planet) =>
              emitEffect(eachState, {
                kind: 'floatText',
                planetId: planet.id,
                text: '☮️ PACIFIST',
                color: '#8affc0',
              }),
            logged,
          ),
        )
        .value(),
    );
}
