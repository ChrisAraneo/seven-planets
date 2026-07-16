import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import { COMBAT, HOME_FIELD, PACIFIST_DEF_BONUS } from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { computeActionDrawProbability } from './compute-action-draw-probability';
import { computeAggression } from './compute-aggression';
import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { canTarget } from './can-target';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeProjectedStrike } from './compute-projected-strike';
import { computeRecruitRate } from './compute-recruit-rate';

export function computeHoldProbability(
  owner: Player,
  planet: Planet,
  garrison: number,
  protectedUntil: number = planet.protectedUntil,
  horizon: number = getAiState().W.holdHorizon,
): number {
  let holdProbability = 1;
  const reinforcementRate =
    computeRecruitRate(owner) * (planet.buildings.BARRACKS ? 0.7 : 0.25);
  const shieldDefense =
    computeShieldDefense(planet) + computeSingularityDefenseBonus(planet);
  const pacifistBonus = owner.hasPacifistStatus ? PACIFIST_DEF_BONUS : 0;
  for (const attacker of getAlivePlayers()) {
    if (attacker.id === owner.id || attacker.hasPacifistStatus) {
      continue;
    }
    if (!canTarget(attacker, owner)) {
      continue;
    }
    let peakWinProbability = 0;
    for (let turnsAhead = 1; turnsAhead <= horizon; turnsAhead++) {
      if (getTurn() + turnsAhead <= protectedUntil) {
        continue;
      }
      const defenders = Math.round(garrison + reinforcementRate * turnsAhead);
      const strike = computeProjectedStrike(attacker, turnsAhead, planet.id);
      if (strike.n < 2 || strike.n < computeMinimumTroopsToConquer(defenders)) {
        continue;
      }
      const defenseBase =
        COMBAT.defensePerTroop * defenders +
        shieldDefense +
        pacifistBonus +
        HOME_FIELD;
      const attackBase = COMBAT.attackPerTroop * strike.n + strike.bonus;
      peakWinProbability = Math.max(
        peakWinProbability,
        computeBattleWinProbability(attackBase, defenseBase),
      );
    }
    if (peakWinProbability <= 0) {
      continue;
    }
    const drawWindow = Math.max(
      1,
      horizon - Math.max(0, protectedUntil - getTurn()),
    );
    const attackCardProbability =
      (attacker.hand.ATTACK || 0) > 0
        ? 0.95
        : 1 - (1 - computeActionDrawProbability('ATTACK')) ** drawWindow;
    holdProbability *=
      1 -
      peakWinProbability * attackCardProbability * computeAggression(attacker);
  }
  return holdProbability;
}
