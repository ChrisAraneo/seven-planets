import { chain } from 'lodash-es';
import { match } from 'ts-pattern';
import {
  NO_PRESENTATION,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  PACIFIST_TURNS,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

import { log } from './log';
import { ownedPlanets } from './owned-planets';
import { updatePlayer } from './update-player';

// Promote any player who has gone PACIFIST_TURNS without attacking. A player who
// Has once broken a pacifist vow (pacifismForfeited) can never be promoted again.
export function updatePacifistStatus(
  state: GameState,
  hooks: PresentationHooks = NO_PRESENTATION,
): GameState {
  return state.players.reduce(
    (s, p) => promoteIfVowKept(s, p, state.turn, hooks),
    state,
  );
}

function promoteIfVowKept(
  s: GameState,
  p: Player,
  turn: number,
  hooks: PresentationHooks,
): GameState {
  return match(p)
    .when(
      (pl) => !pl.isAlive || pl.hasPacifistStatus || pl.pacifismForfeited,
      () => s,
    )
    .when(
      (pl) => turn - pl.lastAttackTurn < PACIFIST_TURNS,
      () => s,
    )
    .otherwise((pl) =>
      chain(updatePlayer(s, pl.id, (x) => ({ ...x, hasPacifistStatus: true })))
        .thru((promoted) =>
          log(
            promoted,
            `☮️ ${pl.name} has forsworn war for ${PACIFIST_TURNS} turns and becomes a PACIFIST — every planet gains +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per turn. Attacking would break the vow for good.`,
            'sys',
          ),
        )
        .tap((logged) =>
          ownedPlanets(logged, pl).forEach((planet) =>
            hooks.floatText(planet, '☮️ PACIFIST', '#8affc0'),
          ),
        )
        .value(),
    );
}
