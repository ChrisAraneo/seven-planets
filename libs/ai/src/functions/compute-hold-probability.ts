import type { Planet, Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { COMBAT, HOME_FIELD, PACIFIST_DEF_BONUS } from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { canTarget } from './can-target';
import { computeActionDrawProbability } from './compute-action-draw-probability';
import { computeAggression } from './compute-aggression';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeProjectedStrike } from './compute-projected-strike';
import { computeRecruitRate } from './compute-recruit-rate';

interface HoldContext {
  planet: Planet;
  garrison: number;
  protectedUntil: number;
  horizon: number;
  reinforcementRate: number;
  staticDefense: number;
}

export const computeHoldProbability = (
  owner: Player,
  planet: Planet,
  garrison: number,
  protectedUntil: number = planet.protectedUntil,
  horizon: number = getAiState().W.holdHorizon,
): number => {
  let holdProbability = 1;
  const context: HoldContext = {
    planet,
    garrison,
    protectedUntil,
    horizon,
    reinforcementRate:
      computeRecruitRate(owner) * (planet.buildings.BARRACKS ? 0.7 : 0.25),
    staticDefense:
      computeShieldDefense(planet) +
      computeSingularityDefenseBonus(planet) +
      (owner.hasPacifistStatus ? PACIFIST_DEF_BONUS : 0) +
      HOME_FIELD,
  };
  for (const attacker of getAlivePlayers()) {
    const isThreat =
      attacker.id !== owner.id &&
      !attacker.hasPacifistStatus &&
      canTarget(attacker, owner);
    if (isThreat) {
      holdProbability *= 1 - computeAttackerThreat(context, attacker);
    }
  }
  return holdProbability;
};

const computeAttackerThreat = (
  context: HoldContext,
  attacker: Player,
): number => {
  const peakWinProbability = computePeakWinProbability(context, attacker);
  if (peakWinProbability <= 0) {
    return 0;
  }
  const drawWindow = Math.max(
    1,
    context.horizon - Math.max(0, context.protectedUntil - getTurn()),
  );
  const attackCardProbability =
    (attacker.hand.ATTACK || 0) > 0
      ? 0.95
      : 1 - (1 - computeActionDrawProbability('ATTACK')) ** drawWindow;
  return (
    peakWinProbability * attackCardProbability * computeAggression(attacker)
  );
};

const computePeakWinProbability = (
  context: HoldContext,
  attacker: Player,
): number => {
  let peakWinProbability = 0;
  for (let turnsAhead = 1; turnsAhead <= context.horizon; turnsAhead++) {
    if (getTurn() + turnsAhead > context.protectedUntil) {
      const defenders = Math.round(
        context.garrison + context.reinforcementRate * turnsAhead,
      );
      const strike = computeProjectedStrike(
        attacker,
        turnsAhead,
        context.planet.id,
      );
      if (
        strike.n >= 2 &&
        strike.n >= computeMinimumTroopsToConquer(defenders)
      ) {
        const defenseBase =
          COMBAT.defensePerTroop * defenders + context.staticDefense;
        const attackBase = COMBAT.attackPerTroop * strike.n + strike.bonus;
        peakWinProbability = Math.max(
          peakWinProbability,
          computeBattleWinProbability(attackBase, defenseBase),
        );
      }
    }
  }
  return peakWinProbability;
};
