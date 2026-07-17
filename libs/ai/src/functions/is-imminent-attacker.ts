import type { Player } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';

import { canTarget } from './can-target';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeDefenseBase } from './compute-defense-base';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeProjectedStrike } from './compute-projected-strike';
import { getOwnedPlanets } from './get-owned-planets';
import { isUnderTruce } from './is-under-truce';

export function isImminentAttacker(owner: Player, attacker: Player): boolean {
  if (attacker.hasPacifistStatus || (attacker.hand.ATTACK || 0) < 1) {
    return false;
  }
  if (!canTarget(attacker, owner)) {
    return false;
  }
  for (const planet of getOwnedPlanets(owner)) {
    if (!isUnderTruce(planet)) {
      const strike = computeProjectedStrike(attacker, 0, planet.id);
      if (strike.n >= computeMinimumTroopsToConquer(planet.troops)) {
        const winProbability = computeBattleWinProbability(
          COMBAT.attackPerTroop * strike.n + strike.bonus,
          computeDefenseBase(planet),
        );
        if (winProbability >= 0.35) {
          return true;
        }
      }
    }
  }
  return false;
}
