import { getTurn } from '@/game/getters/get-turn';
import {
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  PACIFIST_TURNS,
} from '@/game/config/constants';
import { floatText } from '@/game/hooks';
import type { GameState } from '@/game/types';

import { log } from './log';
import { ownedPlanets } from './owned-planets';

// Promote any player who has gone PACIFIST_TURNS without attacking. A player who
// Has once broken a pacifist vow (pacifismForfeited) can never be promoted again.
export function updatePacifistStatus(state: GameState): void {
  for (const p of state.players) {
    if (!p.alive || p.pacifistStatus || p.pacifismForfeited) {
      continue;
    }
    if (getTurn() - p.lastAttackTurn >= PACIFIST_TURNS) {
      p.pacifistStatus = true;
      log(
        state,
        `☮️ ${p.name} has forsworn war for ${PACIFIST_TURNS} turns and becomes a PACIFIST — every planet gains +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per turn. Attacking would break the vow for good.`,
        'sys',
      );
      for (const pl of ownedPlanets(state, p)) {
        floatText(pl, '☮️ PACIFIST', '#8affc0');
      }
    }
  }
}
