import { COMBAT } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { aggression } from './aggression';
import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
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
  for (const player of getAlivePlayers()) {
    if (
      player.id === ownerP.id ||
      player.hasPacifistStatus ||
      (player.hand.ATTACK || 0) < 1
    ) {
      continue;
    }
    if (!mayTarget(player, ownerP)) {
      continue;
    }
    const strike = projectedStrike(player, 0, planet.id);
    if (strike.n < minTroopsToConquer(planet.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(planet),
    );
    pSafe *= 1 - pWin * aggression(player);
  }
  return 1 - pSafe;
}
