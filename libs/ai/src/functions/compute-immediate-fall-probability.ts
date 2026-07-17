import type { Planet, Player } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { canTarget } from './can-target';
import { computeAggression } from './compute-aggression';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeDefenseBase } from './compute-defense-base';
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
    const isThreat =
      attacker.id !== owner.id &&
      !attacker.hasPacifistStatus &&
      (attacker.hand.ATTACK || 0) >= 1 &&
      canTarget(attacker, owner);
    if (isThreat) {
      const strike = computeProjectedStrike(attacker, 0, planet.id);
      if (strike.n >= computeMinimumTroopsToConquer(planet.troops)) {
        const winProbability = computeBattleWinProbability(
          COMBAT.attackPerTroop * strike.n + strike.bonus,
          computeDefenseBase(planet),
        );
        safeProbability *= 1 - winProbability * computeAggression(attacker);
      }
    }
  }
  return 1 - safeProbability;
}
