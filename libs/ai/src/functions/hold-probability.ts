import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import {
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@seven-planets/game';
import { singularityDefBonus } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

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
  const pacBonus = owner.hasPacifistStatus ? PACIFIST_DEF_BONUS : 0;
  for (const player of alive()) {
    if (player.id === owner.id || player.hasPacifistStatus) {
      continue;
    }
    if (!mayTarget(player, owner)) {
      continue;
    }
    let peak = 0;
    for (let total = 1; total <= horizon; total++) {
      if (getTurn() + total <= protectedUntil) {
        continue;
      }
      const game = Math.round(garrison + reinforce * total);
      const strike = projectedStrike(player, total, planet.id);
      if (strike.n < 2 || strike.n < minTroopsToConquer(game)) {
        continue;
      }
      const def =
        COMBAT.defensePerTroop * game + shield + pacBonus + HOME_FIELD;
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
      (player.hand.ATTACK || 0) > 0
        ? 0.95
        : 1 - (1 - actionDrawProb('ATTACK')) ** window;
    pHold *= 1 - peak * pCard * aggression(player);
  }
  return pHold;
}
