import { COMBAT } from '@/game/constants';
import type { GameState, Player } from '@/game/types';
import { battleWinProb } from './battle-win-prob';
import { defenseBaseOf } from './defense-base-of';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { projectedStrike } from './projected-strike';
import { underTruce } from './under-truce';

export function imminentAttacker(s: GameState, us: Player, r: Player): boolean {
  if (r.pacifistStatus || (r.hand.ATTACK || 0) < 1) {
    return false;
  }
  if (!mayTarget(r, us)) {
    return false;
  }
  for (const pl of owned(s, us)) {
    if (underTruce(s, pl)) {
      continue;
    }
    const strike = projectedStrike(s, r, 0, pl.id);
    if (strike.n < minTroopsToConquer(pl.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(s, pl),
    );
    if (pWin >= 0.35) {
      return true;
    }
  }
  return false;
}
