import { COMBAT } from '@/game/constants';
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { battleWinProb } from './battle-win-prob';
import { defenseBaseOf } from './defense-base-of';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { projectedStrike } from './projected-strike';
import { underTruce } from './under-truce';

export function imminentAttacker(us: Player, r: Player): boolean {
  const s = getGameState();
  if (r.pacifistStatus || (r.hand.ATTACK || 0) < 1) {
    return false;
  }
  if (!mayTarget(r, us)) {
    return false;
  }
  for (const pl of owned(us)) {
    if (underTruce(pl)) {
      continue;
    }
    const strike = projectedStrike(r, 0, pl.id);
    if (strike.n < minTroopsToConquer(pl.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(pl),
    );
    if (pWin >= 0.35) {
      return true;
    }
  }
  return false;
}
