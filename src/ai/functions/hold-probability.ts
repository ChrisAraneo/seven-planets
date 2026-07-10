import { getTurn } from '@/game/getters/get-turn';
import { getAiState } from '@/ai/state';
import {
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@/game/config/constants';
import { singularityDefBonus } from '@/game/functions/singularity-def-bonus';
import type { Planet, Player } from '@/game/types';

import { actionDrawProb } from './action-draw-prob';
import { aggression } from './aggression';
import { alive } from './alive';
import { battleWinProb } from './battle-win-prob';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { projectedStrike } from './projected-strike';
import { recruitRate } from './recruit-rate';

export function holdProbability(
  owner: Player,
  planet: Planet,
  garrison: number,
  protectedUntil: number = planet.protectedUntil,
  horizon: number = getAiState().W.holdHorizon,
): number {
  let pHold = 1;
  const reinforce =
    recruitRate(owner) * (planet.buildings.BARRACKS ? 0.7 : 0.25);
  const shield =
    (planet.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    singularityDefBonus(planet);
  const pacBonus = owner.pacifistStatus ? PACIFIST_DEF_BONUS : 0;
  for (const r of alive()) {
    if (r.id === owner.id || r.pacifistStatus) {
      continue;
    }
    if (!mayTarget(r, owner)) {
      continue;
    }
    let peak = 0;
    for (let t = 1; t <= horizon; t++) {
      if (getTurn() + t <= protectedUntil) {
        continue;
      }
      const g = Math.round(garrison + reinforce * t);
      const strike = projectedStrike(r, t, planet.id);
      if (strike.n < 2 || strike.n < minTroopsToConquer(g)) {
        continue;
      }
      const def = COMBAT.defensePerTroop * g + shield + pacBonus + HOME_FIELD;
      const atk = COMBAT.attackPerTroop * strike.n + strike.bonus;
      peak = Math.max(peak, battleWinProb(atk, def));
    }
    if (peak <= 0) {
      continue;
    }
    const window = Math.max(
      1,
      horizon - Math.max(0, protectedUntil - getTurn()),
    );
    const pCard =
      (r.hand.ATTACK || 0) > 0
        ? 0.95
        : 1 - (1 - actionDrawProb('ATTACK')) ** window;
    pHold *= 1 - peak * pCard * aggression(r);
  }
  return pHold;
}
