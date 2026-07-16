import { COMBAT } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { computeAggression } from './compute-aggression';
import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeDefenseBase } from './compute-defense-base';
import { canTarget } from './can-target';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeProjectedStrike } from './compute-projected-strike';
import { isUnderTruce } from './is-under-truce';

export function computeImmediateFallProbability(
  owner: Player,
  planet: Planet,
): number {
  if (isUnderTruce(planet)) {
    return 0;
  }
  let safeProbability = 1;
  for (const attacker of getAlivePlayers()) {
    if (
      attacker.id === owner.id ||
      attacker.hasPacifistStatus ||
      (attacker.hand.ATTACK || 0) < 1
    ) {
      continue;
    }
    if (!canTarget(attacker, owner)) {
      continue;
    }
    const strike = computeProjectedStrike(attacker, 0, planet.id);
    if (strike.n < computeMinimumTroopsToConquer(planet.troops)) {
      continue;
    }
    const winProbability = computeBattleWinProbability(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      computeDefenseBase(planet),
    );
    safeProbability *= 1 - winProbability * computeAggression(attacker);
  }
  return 1 - safeProbability;
}
