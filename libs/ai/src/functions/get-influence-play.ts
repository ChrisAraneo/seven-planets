import type {
  InfluenceOptions,
  InfluenceType,
  Player,
} from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { computeAverageStrength } from './compute-average-strength';
import { computeImmediateFallProbability } from './compute-immediate-fall-probability';
import { computePlayerStrength } from './compute-player-strength';
import { getBestCoupTarget } from './get-best-coup-target';
import { getOwnedPlanets } from './get-owned-planets';
import { getPlan } from './get-plan';
import { getSkipTarget } from './get-skip-target';
import { hasBuilding } from './has-building';
import { isImminentAttacker } from './is-imminent-attacker';

interface InfluencePlay {
  type: InfluenceType;
  options: InfluenceOptions;
  ev: number;
}

export const getInfluencePlay = (player: Player): InfluencePlay | null =>
  getCoupPlay(player) ??
  getPeacePlay(player) ??
  getSkipPlay(player) ??
  getStealPlay(player);

const getCoupPlay = (player: Player): InfluencePlay | null => {
  if ((player.hand.COUP || 0) < 1) {
    return null;
  }
  const coupTarget = getBestCoupTarget(player);
  if (coupTarget && coupTarget.value >= getAiState().W.coupValueFloor) {
    return {
      type: 'COUP',
      options: { planet: coupTarget.planet },
      ev: coupTarget.value,
    };
  }
  return null;
};

const getPeacePlay = (player: Player): InfluencePlay | null => {
  if ((player.hand.PEACE || 0) < 1) {
    return null;
  }
  const worstFall = Math.max(
    0,
    ...getOwnedPlanets(player).map((planet) =>
      computeImmediateFallProbability(player, planet),
    ),
  );
  if (worstFall >= getAiState().W.peaceThreatFloor) {
    return { type: 'PEACE', options: {}, ev: worstFall * 10 };
  }
  return null;
};

const getSkipPlay = (player: Player): InfluencePlay | null => {
  const averageStrength = computeAverageStrength();
  for (const influenceType of [
    'SKIP_ARMY',
    'SKIP_PLANETS',
    'SKIP_TECH',
    'SKIP_INFLUENCE',
  ] as InfluenceType[]) {
    if ((player.hand[influenceType] || 0) >= 1) {
      const target = getSkipTarget(player, influenceType);
      const isScary =
        target &&
        (computePlayerStrength(target) >= averageStrength * 1.15 ||
          isImminentAttacker(player, target) ||
          getAlivePlayers().length === 2);
      if (isScary) {
        return { type: influenceType, options: {}, ev: 3 };
      }
    }
  }
  return null;
};

const getStealPlay = (player: Player): InfluencePlay | null => {
  if ((player.hand.STEAL_ACTION || 0) < 1) {
    return null;
  }
  const plan = getPlan(player);
  const rivals = getAlivePlayers().filter((rival) => rival.id !== player.id);
  const byDescendingStrength = (firstRival: Player, secondRival: Player) =>
    computePlayerStrength(secondRival) - computePlayerStrength(firstRival);
  const dangerousRivals = rivals
    .filter((rival) => isImminentAttacker(player, rival))
    .toSorted(byDescendingStrength);
  if (dangerousRivals.length > 0) {
    return {
      type: 'STEAL_ACTION',
      options: { target: dangerousRivals[0], cardType: 'ATTACK' },
      ev: 3,
    };
  }
  if (
    (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
    (player.hand.ATTACK || 0) === 0 &&
    hasBuilding(player, 'SILO')
  ) {
    const holder = rivals
      .filter((rival) => (rival.hand.ATTACK || 0) > 0)
      .toSorted(byDescendingStrength)
      .at(0);
    if (holder) {
      return {
        type: 'STEAL_ACTION',
        options: { target: holder, cardType: 'ATTACK' },
        ev: 2.5,
      };
    }
  }
  return getWantedCardSteal(player, rivals, byDescendingStrength);
};

const getWantedCardSteal = (
  player: Player,
  rivals: Player[],
  byDescendingStrength: (firstRival: Player, secondRival: Player) => number,
): InfluencePlay | null => {
  const averageStrength = computeAverageStrength();
  const wantedCardTypes: ('RECRUIT' | 'TRADE')[] = [];
  if (hasBuilding(player, 'BARRACKS') && (player.hand.RECRUIT || 0) === 0) {
    wantedCardTypes.push('RECRUIT');
  }
  if (hasBuilding(player, 'EMBASSY') && (player.hand.TRADE || 0) === 0) {
    wantedCardTypes.push('TRADE');
  }
  for (const wantedCardType of wantedCardTypes) {
    const holder = rivals
      .filter(
        (rival) =>
          (rival.hand[wantedCardType] || 0) > 0 &&
          computePlayerStrength(rival) >= averageStrength,
      )
      .toSorted(byDescendingStrength)
      .at(0);
    if (holder) {
      return {
        type: 'STEAL_ACTION',
        options: { target: holder, cardType: wantedCardType },
        ev: 2,
      };
    }
  }
  return null;
};
