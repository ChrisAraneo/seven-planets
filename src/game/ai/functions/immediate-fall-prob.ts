import { COMBAT } from '@/game/constants';
import type { GameState, Planet, Player } from '@/game/types';
import { aggression } from './aggression';
import { alive } from './alive';
import { battleWinProb } from './battle-win-prob';
import { attackBaseOf } from './attack-base-of';
import { defenseBaseOf } from './defense-base-of';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { projectedStrike } from './projected-strike';
import { underTruce } from './under-truce';

export function immediateFallProb(
  s: GameState,
  ownerP: Player,
  planet: Planet,
): number {
  if (underTruce(s, planet)) {
    return 0;
  }
  let pSafe = 1;
  for (const r of alive(s)) {
    if (r.id === ownerP.id || r.pacifistStatus || (r.hand.ATTACK || 0) < 1) {
      continue;
    }
    if (!mayTarget(r, ownerP)) {
      continue;
    }
    const strike = projectedStrike(s, r, 0, planet.id);
    if (strike.n < minTroopsToConquer(planet.troops)) {
      continue;
    }
    const pWin = battleWinProb(
      COMBAT.attackPerTroop * strike.n + strike.bonus,
      defenseBaseOf(s, planet),
    );
    pSafe *= 1 - pWin * aggression(r);
  }
  return 1 - pSafe;
}
