import { getGameState } from '@seven-planets/game';
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

export function computePlan(p: Player, prevKind: StrategyKind | null): Plan {
  const aiState = getAiState();
  let queue = buildCandidates(p);

  const tempo = Math.min(1.8, 0.8 + getTurn() / 50);
  const ecoTempo = Math.max(0.45, 1.15 - getTurn() / 90);

  const develop =
    queue.slice(0, 3).reduce((x, c) => x + c.worth * c.pComplete, 0) *
    0.45 *
    ecoTempo;

  const strike = bestAttackNow(p);
  const strikeScore =
    strike && strike.conquers ? strike.score * 1.25 * tempo : 0;

  let militarize = 0;
  let targetId: number | null = null;
  let troopsNeeded = 0;
  const silos = owned(p).filter((pl) => pl.buildings.SILO);
  const staging =
    silos.length > 0
      ? silos.reduce((a, b) =>
          rocketCap(b) > rocketCap(a) ||
          (rocketCap(b) === rocketCap(a) && b.troops > a.troops)
            ? b
            : a,
        )
      : null;
  if (!p.hasPacifistStatus) {
    const rr = Math.max(0.4, recruitRate(p));
    const bonus = staging ? (staging.buildings.SILO || 0) * 2 : 0;
    for (const target of getGameState().planets) {
      if (target.ownerId === p.id) {
        continue;
      }
      const defOwner = getGameState().players[target.ownerId];
      if (!defOwner.isAlive) {
        continue;
      }
      if (!mayTarget(p, defOwner)) {
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
        Math.max(0, Math.ceil((need + aiState.W.reserveTroops - have) / rr)) +
        (staging ? 0 : 4);
      if (eta > aiState.W.planHorizon + 4) {
        continue;
      }
      const hold = holdProbability(
        p,
        target,
        survivorsAfterWin(need),
        getTurn() + CONQUEST_TRUCE,
      );
      const value =
        planetValue(target) + (owned(defOwner).length === 1 ? 10 : 0);
      const sc =
        (value * 0.75 * hold * 0.9 ** eta - need * aiState.W.troopValue * 0.3) *
        tempo;
      if (sc > militarize) {
        militarize = sc;
        targetId = target.id;
        troopsNeeded = need + aiState.W.reserveTroops;
      }
    }
  }

  let threat = 0;
  for (const pl of owned(p)) {
    threat +=
      (1 - holdProbability(p, pl, pl.troops)) *
      planetValue(pl) *
      (owned(p).length === 1 ? 3 : 0.6);
  }
  const fortify = threat * 0.9;

  const coupCost = INFLUENCE_CARDS.COUP.cost;
  const coupTgt = bestCoupTarget(p);
  let coupBank = 0;
  if (coupTgt && getTurn() >= ACTION_CARDS_FROM_TURN) {
    const starIncome = influenceIncome(p);
    const turnsTo =
      p.influence >= coupCost
        ? 0
        : starIncome > 0.05
          ? (coupCost - p.influence) / starIncome
          : 99;
    if (turnsTo <= aiState.W.planHorizon * 2) {
      coupBank = coupTgt.value * 0.92 ** turnsTo * 0.8;
    }
    if (p.influence < coupCost) {
      if (owned(p).length <= 1) {
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
  for (const k of Object.keys(scores) as StrategyKind[]) {
    if (scores[k] > scores[kind]) {
      kind = k;
    }
  }

  const enabler =
    kind === 'MILITARIZE' || kind === 'STRIKE'
      ? (c: BuildCandidate) =>
          (c.id === 'BARRACKS' && !hasB(p, 'BARRACKS')) ||
          (c.id === 'SILO' && !hasB(p, 'SILO'))
      : kind === 'FORTIFY'
        ? (c: BuildCandidate) =>
            (c.id === 'BARRACKS' && !hasB(p, 'BARRACKS')) || c.id === 'SHIELD'
        : null;
  if (enabler) {
    queue = [...queue.filter(enabler), ...queue.filter((c) => !enabler(c))];
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
