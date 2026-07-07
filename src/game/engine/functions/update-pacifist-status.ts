import {
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  PACIFIST_TURNS,
} from '@/game/constants';
import { floatText } from '@/game/effects';
import { getState } from '../state';
import { log } from './log';
import { ownedPlanets } from './owned-planets';

// Promote any player who has gone PACIFIST_TURNS without attacking. A player who
// Has once broken a pacifist vow (pacifismForfeited) can never be promoted again.
export function updatePacifistStatus(): void {
  for (const p of getState().players) {
    if (!p.alive || p.pacifistStatus || p.pacifismForfeited) {
      continue;
    }
    if (getState().turn - p.lastAttackTurn >= PACIFIST_TURNS) {
      p.pacifistStatus = true;
      log(
        `☮️ ${p.name} has forsworn war for ${PACIFIST_TURNS} turns and becomes a PACIFIST — every planet gains +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per turn. Attacking would break the vow for good.`,
        'sys',
      );
      for (const pl of ownedPlanets(p)) {
        floatText(pl, '☮️ PACIFIST', '#8affc0');
      }
    }
  }
}
