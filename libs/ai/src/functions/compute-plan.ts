import { getGameStateLastValue } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import {
  ACTION_CARDS_FROM_TURN,
  COMBAT,
  CONQUEST_TRUCE,
  HOME_FIELD,
  INFLUENCE_CARDS,
  PACIFIST_DEF_BONUS,
} from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { computeBattleWinProbability } from './compute-battle-win-probability';
import { getBestAttackNow } from './get-best-attack-now';
import { getBestCoupTarget } from './get-best-coup-target';
import type { BuildCandidate } from './get-build-candidates';
import { getBuildCandidates } from './get-build-candidates';
import { computeEffectiveMinimumConquerProbability } from './compute-effective-minimum-conquer-probability';
import { hasBuilding } from './has-building';
import { computeHoldProbability } from './compute-hold-probability';
import { computeInfluenceIncome } from './compute-influence-income';
import { canTarget } from './can-target';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { getOwnedPlanets } from './get-owned-planets';
import type { Plan, StrategyKind } from './plan-types';
import { computePlanetValue } from './compute-planet-value';
import { computeRecruitRate } from './compute-recruit-rate';
import { computeSurvivorsAfterWin } from './compute-survivors-after-win';
import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';

export function computePlan(
  player: Player,
  prevKind: StrategyKind | null,
): Plan {
  const aiState = getAiState();
  let queue = getBuildCandidates(player);

  const tempo = Math.min(1.8, 0.8 + getTurn() / 50);
  const ecoTempo = Math.max(0.45, 1.15 - getTurn() / 90);

  const develop =
    queue
      .slice(0, 3)
      .reduce(
        (sum, candidate) => sum + candidate.worth * candidate.pComplete,
        0,
      ) *
    0.45 *
    ecoTempo;

  const strike = getBestAttackNow(player);
  const strikeScore =
    strike && strike.conquers ? strike.score * 1.25 * tempo : 0;

  let militarize = 0;
  let targetId: number | null = null;
  let troopsNeeded = 0;
  const silos = getOwnedPlanets(player).filter(
    (planet) => planet.buildings.SILO,
  );
  const staging =
    silos.length > 0
      ? silos.reduce((best, candidatePlanet) =>
          getRocketCapacity(candidatePlanet) > getRocketCapacity(best) ||
          (getRocketCapacity(candidatePlanet) === getRocketCapacity(best) &&
            candidatePlanet.troops > best.troops)
            ? candidatePlanet
            : best,
        )
      : null;
  if (!player.hasPacifistStatus) {
    const recruitmentRate = Math.max(0.4, computeRecruitRate(player));
    const stagingBonus = staging ? (staging.buildings.SILO || 0) * 2 : 0;
    for (const target of getGameStateLastValue().planets) {
      if (target.ownerId === player.id) {
        continue;
      }
      const defenderOwner = getPlayerByIndex(target.ownerId);

      if (!defenderOwner) {
        continue;
      }

      if (!defenderOwner.isAlive) {
        continue;
      }

      if (!canTarget(player, defenderOwner)) {
        continue;
      }

      const futureDefenders = Math.round(
        target.troops + computeRecruitRate(defenderOwner) * 3,
      );
      let neededTroops = computeMinimumTroopsToConquer(futureDefenders);
      const defenseBase =
        COMBAT.defensePerTroop * futureDefenders +
        computeShieldDefense(target) +
        (defenderOwner.hasPacifistStatus ? PACIFIST_DEF_BONUS : 0) +
        computeSingularityDefenseBonus(target) +
        HOME_FIELD;
      while (
        neededTroops < 80 &&
        computeBattleWinProbability(
          COMBAT.attackPerTroop * neededTroops + stagingBonus,
          defenseBase,
        ) < computeEffectiveMinimumConquerProbability()
      ) {
        neededTroops++;
      }
      if (
        staging &&
        getRocketCapacity(staging) < neededTroops &&
        (staging.buildings.SILO || 0) < 2
      ) {
        continue;
      }
      const stagedTroops = staging ? staging.troops : 0;
      const turnsToStage =
        Math.max(
          0,
          Math.ceil(
            (neededTroops + aiState.W.reserveTroops - stagedTroops) /
              recruitmentRate,
          ),
        ) + (staging ? 0 : 4);
      if (turnsToStage > aiState.W.planHorizon + 4) {
        continue;
      }
      const holdProbability = computeHoldProbability(
        player,
        target,
        computeSurvivorsAfterWin(neededTroops),
        getTurn() + CONQUEST_TRUCE,
      );
      const value =
        computePlanetValue(target) +
        (getOwnedPlanets(defenderOwner).length === 1 ? 10 : 0);
      const score =
        (value * 0.75 * holdProbability * 0.9 ** turnsToStage -
          neededTroops * aiState.W.troopValue * 0.3) *
        tempo;
      if (score > militarize) {
        militarize = score;
        targetId = target.id;
        troopsNeeded = neededTroops + aiState.W.reserveTroops;
      }
    }
  }

  let threat = 0;
  for (const planet of getOwnedPlanets(player)) {
    threat +=
      (1 - computeHoldProbability(player, planet, planet.troops)) *
      computePlanetValue(planet) *
      (getOwnedPlanets(player).length === 1 ? 3 : 0.6);
  }
  const fortify = threat * 0.9;

  const coupCost = INFLUENCE_CARDS.COUP.cost;
  const coupTarget = getBestCoupTarget(player);
  let coupBank = 0;
  if (coupTarget && getTurn() >= ACTION_CARDS_FROM_TURN) {
    const starIncome = computeInfluenceIncome(player);
    const turnsToCoup =
      player.influence >= coupCost
        ? 0
        : starIncome > 0.05
          ? (coupCost - player.influence) / starIncome
          : 99;
    if (turnsToCoup <= aiState.W.planHorizon * 2) {
      coupBank = coupTarget.value * 0.92 ** turnsToCoup * 0.8;
    }
    if (player.influence < coupCost) {
      if (getOwnedPlanets(player).length <= 1) {
        coupBank *= 0.35;
      }
      coupBank *= Math.max(0.3, 1 - threat * 0.08);
    }
  }

  const scores: Record<StrategyKind, number> = {
    DEVELOP: develop,
    STRIKE: strikeScore,
    MILITARIZE: militarize,
    FORTIFY: fortify,
    COUP_BANK: coupBank,
  };
  if (prevKind) {
    scores[prevKind] *= aiState.W.planStickiness;
  }
  let kind: StrategyKind = 'DEVELOP';
  for (const strategyKind of Object.keys(scores) as StrategyKind[]) {
    if (scores[strategyKind] > scores[kind]) {
      kind = strategyKind;
    }
  }

  const enabler =
    kind === 'MILITARIZE' || kind === 'STRIKE'
      ? (candidate: BuildCandidate) =>
          (candidate.id === 'BARRACKS' && !hasBuilding(player, 'BARRACKS')) ||
          (candidate.id === 'SILO' && !hasBuilding(player, 'SILO'))
      : kind === 'FORTIFY'
        ? (candidate: BuildCandidate) =>
            (candidate.id === 'BARRACKS' && !hasBuilding(player, 'BARRACKS')) ||
            candidate.id === 'SHIELD'
        : null;
  if (enabler) {
    queue = [
      ...queue.filter(enabler),
      ...queue.filter((candidate) => !enabler(candidate)),
    ];
  }

  return {
    kind,
    computedTurn: getTurn(),
    buildQueue: queue,
    strike,
    targetId,
    stagingId: staging?.id ?? null,
    troopsNeeded,
    threat,
    scores,
  };
}
