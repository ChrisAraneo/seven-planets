import type { Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
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

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getAiState } from '../state';
import { canTarget } from './can-target';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeEffectiveMinimumConquerProbability } from './compute-effective-minimum-conquer-probability';
import { computeHoldProbability } from './compute-hold-probability';
import { computeInfluenceIncome } from './compute-influence-income';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computePlanetValue } from './compute-planet-value';
import { computeRecruitRate } from './compute-recruit-rate';
import { computeSurvivorsAfterWin } from './compute-survivors-after-win';
import { getBestAttackNow } from './get-best-attack-now';
import { getBestCoupTarget } from './get-best-coup-target';
import type { BuildCandidate } from './get-build-candidates';
import { getBuildCandidates } from './get-build-candidates';
import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';
import type { Plan, StrategyKind } from './plan-types';

interface InvasionPlan {
  score: number;
  targetId: number;
  troopsNeeded: number;
}

const STRATEGY_KINDS: StrategyKind[] = [
  'DEVELOP',
  'STRIKE',
  'MILITARIZE',
  'FORTIFY',
  'COUP_BANK',
];

export function computePlan(
  player: Player,
  prevKind: StrategyKind | null,
): Plan {
  const tempo = Math.min(1.8, 0.8 + getTurn() / 50);
  const queue = getBuildCandidates(player);
  const strike = getBestAttackNow(player);
  const staging = getStagingPlanet(player);
  const invasion = player.hasPacifistStatus
    ? null
    : computeBestInvasion(player, staging, tempo);
  const threat = computeThreat(player);
  const scores: Record<StrategyKind, number> = {
    DEVELOP: computeDevelopScore(queue),
    STRIKE: strike && strike.willConquer ? strike.score * 1.25 * tempo : 0,
    MILITARIZE: invasion?.score ?? 0,
    FORTIFY: threat * 0.9,
    COUP_BANK: computeCoupBankScore(player, threat),
  };
  const kind = pickStrategy(scores, prevKind);
  return {
    kind,
    computedTurn: getTurn(),
    buildQueue: prioritizeEnablers(queue, kind, player),
    strike,
    targetId: invasion?.targetId ?? null,
    stagingId: staging?.id ?? null,
    troopsNeeded: invasion?.troopsNeeded ?? 0,
    threat,
    scores,
  };
}

function computeDevelopScore(queue: BuildCandidate[]): number {
  const ecoTempo = Math.max(0.45, 1.15 - getTurn() / 90);
  return (
    queue
      .slice(0, 3)
      .reduce(
        (sum, candidate) => sum + candidate.worth * candidate.pComplete,
        0,
      ) *
    0.45 *
    ecoTempo
  );
}

function getStagingPlanet(player: Player): Planet | null {
  const silos = getOwnedPlanets(player).filter(
    (planet) => planet.buildings.SILO,
  );
  return silos.length > 0
    ? silos.reduce((best, candidatePlanet) =>
        getRocketCapacity(candidatePlanet) > getRocketCapacity(best) ||
        (getRocketCapacity(candidatePlanet) === getRocketCapacity(best) &&
          candidatePlanet.troops > best.troops)
          ? candidatePlanet
          : best,
      )
    : null;
}

function computeBestInvasion(
  player: Player,
  staging: Planet | null,
  tempo: number,
): InvasionPlan | null {
  let best: InvasionPlan | null = null;
  for (const target of getGameStateLastValue().planets) {
    const candidate = scoreInvasion(player, target, staging, tempo);
    if (candidate && candidate.score > (best?.score ?? 0)) {
      best = candidate;
    }
  }
  return best;
}

function scoreInvasion(
  player: Player,
  target: Planet,
  staging: Planet | null,
  tempo: number,
): InvasionPlan | null {
  const aiState = getAiState();
  const defenderOwner = getPlayerByIndex(target.ownerId);
  if (
    target.ownerId === player.id ||
    !defenderOwner?.isAlive ||
    !canTarget(player, defenderOwner)
  ) {
    return null;
  }
  const stagingBonus = staging ? (staging.buildings.SILO || 0) * 2 : 0;
  const neededTroops = computeNeededTroops(target, defenderOwner, stagingBonus);
  if (
    staging &&
    getRocketCapacity(staging) < neededTroops &&
    (staging.buildings.SILO || 0) < 2
  ) {
    return null;
  }
  const turnsToStage = computeTurnsToStage(player, staging, neededTroops);
  if (turnsToStage > aiState.W.planHorizon + 4) {
    return null;
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
  return {
    score,
    targetId: target.id,
    troopsNeeded: neededTroops + aiState.W.reserveTroops,
  };
}

function computeTurnsToStage(
  player: Player,
  staging: Planet | null,
  neededTroops: number,
): number {
  const recruitmentRate = Math.max(0.4, computeRecruitRate(player));
  const stagedTroops = staging ? staging.troops : 0;
  return (
    Math.max(
      0,
      Math.ceil(
        (neededTroops + getAiState().W.reserveTroops - stagedTroops) /
          recruitmentRate,
      ),
    ) + (staging ? 0 : 4)
  );
}

function computeNeededTroops(
  target: Planet,
  defenderOwner: Player,
  stagingBonus: number,
): number {
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
  return neededTroops;
}

function computeThreat(player: Player): number {
  let threat = 0;
  for (const planet of getOwnedPlanets(player)) {
    threat +=
      (1 - computeHoldProbability(player, planet, planet.troops)) *
      computePlanetValue(planet) *
      (getOwnedPlanets(player).length === 1 ? 3 : 0.6);
  }
  return threat;
}

function computeCoupBankScore(player: Player, threat: number): number {
  const aiState = getAiState();
  const coupCost = INFLUENCE_CARDS.COUP.cost;
  const coupTarget = getBestCoupTarget(player);
  if (!coupTarget || getTurn() < ACTION_CARDS_FROM_TURN) {
    return 0;
  }
  const starIncome = computeInfluenceIncome(player);
  const turnsToCoup =
    player.influence >= coupCost
      ? 0
      : starIncome > 0.05
        ? (coupCost - player.influence) / starIncome
        : 99;
  let coupBank = 0;
  if (turnsToCoup <= aiState.W.planHorizon * 2) {
    coupBank = coupTarget.value * 0.92 ** turnsToCoup * 0.8;
  }
  if (player.influence < coupCost) {
    if (getOwnedPlanets(player).length <= 1) {
      coupBank *= 0.35;
    }
    coupBank *= Math.max(0.3, 1 - threat * 0.08);
  }
  return coupBank;
}

function pickStrategy(
  scores: Record<StrategyKind, number>,
  prevKind: StrategyKind | null,
): StrategyKind {
  if (prevKind) {
    scores[prevKind] *= getAiState().W.planStickiness;
  }
  let kind: StrategyKind = 'DEVELOP';
  for (const strategyKind of STRATEGY_KINDS) {
    if (scores[strategyKind] > scores[kind]) {
      kind = strategyKind;
    }
  }
  return kind;
}

function prioritizeEnablers(
  queue: BuildCandidate[],
  kind: StrategyKind,
  player: Player,
): BuildCandidate[] {
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
  if (!enabler) {
    return queue;
  }
  return [
    ...queue.filter((candidate) => enabler(candidate)),
    ...queue.filter((candidate) => !enabler(candidate)),
  ];
}
