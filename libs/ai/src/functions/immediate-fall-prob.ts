import { COMBAT } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { aggression } from './aggression';
import { alive } from './alive';
import { attackBaseOf } from './attack-base-of';
import { battleWinProb } from './battle-win-prob';
import { defenseBaseOf } from './defense-base-of';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { projectedStrike } from './projected-strike';
import { isUnderTruce } from './is-under-truce';

export function immediateFallProb(ownerP: Player, planet: Planet): number {
  if (isUnderTruce(planet)) {
    return 0;
  }
  let pSafe = 1;
  for (const r of alive()) {
    if (r.id === ownerP.id || r.hasPacifistStatus || (r.hand.ATTACK || 0) < 1) {
      continue;
    }
    if (!mayTarget(r, ownerP)) {
      continue;
    }
    const strike = projectedStrike(r, 0, planet.id);
    if (strike.n < minTroopsToConquer(planet.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(planet),
    );
    pSafe *= 1 - pWin * aggression(r);
  }
  return 1 - pSafe;
}
