import {
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  PACIFIST_TURNS,
} from '../config/constants';
import { floatText } from '../hooks';
import type { GameState } from '../interfaces/game-state';

import { log } from './log';
import { ownedPlanets } from './owned-planets';
import { updatePlayer } from './update-player';

// Promote any player who has gone PACIFIST_TURNS without attacking. A player who
// Has once broken a pacifist vow (pacifismForfeited) can never be promoted again.
export function updatePacifistStatus(state: GameState): GameState {
  let s = state;
  for (const p of state.players) {
    if (!p.alive || p.pacifistStatus || p.pacifismForfeited) {
      continue;
    }
    if (state.turn - p.lastAttackTurn >= PACIFIST_TURNS) {
      s = updatePlayer(s, p.id, (pl) => ({ ...pl, pacifistStatus: true }));
      s = log(
        s,
        `☮️ ${p.name} has forsworn war for ${PACIFIST_TURNS} turns and becomes a PACIFIST — every planet gains +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per turn. Attacking would break the vow for good.`,
        'sys',
      );
      for (const pl of ownedPlanets(s, p)) {
        floatText(pl, '☮️ PACIFIST', '#8affc0');
      }
    }
  }
  return s;
}
