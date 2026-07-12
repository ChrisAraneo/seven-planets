import { COMBAT } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { battleWinProb } from './battle-win-prob';
import { defenseBaseOf } from './defense-base-of';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { projectedStrike } from './projected-strike';
import { isUnderTruce } from './is-under-truce';

export function isImminentAttacker(
  player: Player,
  eachPlayer: Player,
): boolean {
  if (eachPlayer.hasPacifistStatus || (eachPlayer.hand.ATTACK || 0) < 1) {
    return false;
  }
  if (!mayTarget(eachPlayer, player)) {
    return false;
  }
  for (const planet of owned(player)) {
    if (isUnderTruce(planet)) {
      continue;
    }
    const strike = projectedStrike(eachPlayer, 0, planet.id);
    if (strike.n < minTroopsToConquer(planet.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(planet),
    );
    if (pWin >= 0.35) {
      return true;
    }
  }
  return false;
}
