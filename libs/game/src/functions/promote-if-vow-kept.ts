import { match } from 'ts-pattern';

import {
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  PACIFIST_TURNS,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { emitEffect } from './emit-effect';
import { getOwnedPlanets } from './extractors/get-owned-planets';
import { log } from './log';
import { updatePlayer } from './update-player';

export const promoteIfVowKept = (
  state: GameState,
  player: Player,
  turn: number,
): GameState =>
  match(player)
    .when(
      () =>
        !player.isAlive ||
        player.hasPacifistStatus ||
        player.hasForfeitedPacifism,
      () => state,
    )
    .when(
      () => turn - player.lastAttackTurn < PACIFIST_TURNS,
      () => state,
    )
    .otherwise(() =>
      chain(
        updatePlayer(state, player.id, (current) => ({
          ...current,
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
          getOwnedPlanets(logged, player).reduce(
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
