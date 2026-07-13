import { getGameStateLastValue } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import {
  ACTION_CARDS_FROM_TURN,
  canAfford,
  COMBAT,
  CONQUEST_TRUCE,
  HOME_FIELD,
  INFLUENCE_CARDS,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@seven-planets/game';
import { rocketCap } from '@seven-planets/game';
import { singularityDefBonus } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { battleWinProb } from './battle-win-prob';
import { bestAttackNow } from './best-attack-now';
import { bestCoupTarget } from './best-coup-target';
import type { BuildCandidate } from './build-candidates';
import { buildCandidates } from './build-candidates';
import { effMinConquerProb } from './eff-min-conquer-prob';
import { hasB } from './has-b';
import { holdProbability } from './hold-probability';
import { influenceIncome } from './influence-income';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import type { Plan, StrategyKind } from './plan-types';
import { planetValue } from './planet-value';
import { recruitRate } from './recruit-rate';
import { survivorsAfterWin } from './survivors-after-win';
import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';

export function computePlan(
  player: Player,
  prevKind: StrategyKind | null,
): Plan {
  const aiState = getAiState();
  let queue = buildCandidates(player);

  const tempo = Math.min(1.8, 0.8 + getTurn() / 50);
  const ecoTempo = Math.max(0.45, 1.15 - getTurn() / 90);

  const develop =
    queue
      .slice(0, 3)
      .reduce(
        (candidate, buildCandidate) =>
          candidate + buildCandidate.worth * buildCandidate.pComplete,
        0,
      ) *
    0.45 *
    ecoTempo;

  const strike = bestAttackNow(player);
  const strikeScore =
    strike && strike.conquers ? strike.score * 1.25 * tempo : 0;

  let militarize = 0;
  let targetId: number | null = null;
  let troopsNeeded = 0;
  const silos = owned(player).filter((planet) => planet.buildings.SILO);
  const staging =
    silos.length > 0
      ? silos.reduce((planet, eachPlanet) =>
          rocketCap(eachPlanet) > rocketCap(planet) ||
          (rocketCap(eachPlanet) === rocketCap(planet) &&
            eachPlanet.troops > planet.troops)
            ? eachPlanet
            : planet,
        )
      : null;
  if (!player.hasPacifistStatus) {
    const rate = Math.max(0.4, recruitRate(player));
    const bonus = staging ? (staging.buildings.SILO || 0) * 2 : 0;
    for (const target of getGameStateLastValue().planets) {
      if (target.ownerId === player.id) {
        continue;
      }
      const defOwner = getPlayerByIndex(target.ownerId);

      if (!defOwner) {
        continue;
      }

      if (!defOwner.isAlive) {
        continue;
      }

      if (!mayTarget(player, defOwner)) {
        continue;
      }

      const futureDef = Math.round(target.troops + recruitRate(defOwner) * 3);
      let need = minTroopsToConquer(futureDef);
      const defB =
        COMBAT.defensePerTroop * futureDef +
        (target.buildings.SHIELD || 0) * SHIELD_DEFENSE +
        (defOwner.hasPacifistStatus ? PACIFIST_DEF_BONUS : 0) +
        singularityDefBonus(target) +
        HOME_FIELD;
      while (
        need < 80 &&
        battleWinProb(COMBAT.attackPerTroop * need + bonus, defB) <
          effMinConquerProb()
      ) {
        need++;
      }
      if (
        staging &&
        rocketCap(staging) < need &&
        (staging.buildings.SILO || 0) < 2
      ) {
        continue;
      }
      const have = staging ? staging.troops : 0;
      const eta =
        Math.max(0, Math.ceil((need + aiState.W.reserveTroops - have) / rate)) +
        (staging ? 0 : 4);
      if (eta > aiState.W.planHorizon + 4) {
        continue;
      }
      const hold = holdProbability(
        player,
        target,
        survivorsAfterWin(need),
        getTurn() + CONQUEST_TRUCE,
      );
      const value =
        planetValue(target) + (owned(defOwner).length === 1 ? 10 : 0);
      const score =
        (value * 0.75 * hold * 0.9 ** eta - need * aiState.W.troopValue * 0.3) *
        tempo;
      if (score > militarize) {
        militarize = score;
        targetId = target.id;
        troopsNeeded = need + aiState.W.reserveTroops;
      }
    }
  }

  let threat = 0;
  for (const planet of owned(player)) {
    threat +=
      (1 - holdProbability(player, planet, planet.troops)) *
      planetValue(planet) *
      (owned(player).length === 1 ? 3 : 0.6);
  }
  const fortify = threat * 0.9;

  const coupCost = INFLUENCE_CARDS.COUP.cost;
  const coupTgt = bestCoupTarget(player);
  let coupBank = 0;
  if (coupTgt && getTurn() >= ACTION_CARDS_FROM_TURN) {
    const starIncome = influenceIncome(player);
    const turnsTo =
      player.influence >= coupCost
        ? 0
        : starIncome > 0.05
          ? (coupCost - player.influence) / starIncome
          : 99;
    if (turnsTo <= aiState.W.planHorizon * 2) {
      coupBank = coupTgt.value * 0.92 ** turnsTo * 0.8;
    }
    if (player.influence < coupCost) {
      if (owned(player).length <= 1) {
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
      ? (buildCandidate: BuildCandidate) =>
          (buildCandidate.id === 'BARRACKS' && !hasB(player, 'BARRACKS')) ||
          (buildCandidate.id === 'SILO' && !hasB(player, 'SILO'))
      : kind === 'FORTIFY'
        ? (buildCandidate: BuildCandidate) =>
            (buildCandidate.id === 'BARRACKS' && !hasB(player, 'BARRACKS')) ||
            buildCandidate.id === 'SHIELD'
        : null;
  if (enabler) {
    queue = [
      ...queue.filter(enabler),
      ...queue.filter((buildCandidate) => !enabler(buildCandidate)),
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
