import { getAiState } from '../state';
import type {
  InfluenceOptions,
  InfluenceType,
  Player,
} from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeAverageStrength } from './compute-average-strength';
import { getBestCoupTarget } from './get-best-coup-target';
import { hasBuilding } from './has-building';
import { computeImmediateFallProbability } from './compute-immediate-fall-probability';
import { isImminentAttacker } from './is-imminent-attacker';
import { getOwnedPlanets } from './get-owned-planets';
import { getPlan } from './get-plan';
import { computePlayerStrength } from './compute-player-strength';
import { getSkipTarget } from './get-skip-target';

export function getInfluencePlay(
  player: Player,
): { type: InfluenceType; options: InfluenceOptions; ev: number } | null {
  const aiState = getAiState();
  const plan = getPlan(player);
  if ((player.hand.COUP || 0) > 0) {
    const coupTarget = getBestCoupTarget(player);
    if (coupTarget && coupTarget.value >= aiState.W.coupValueFloor) {
      return {
        type: 'COUP',
        options: { planet: coupTarget.planet },
        ev: coupTarget.value,
      };
    }
  }
  if ((player.hand.PEACE || 0) > 0) {
    const worstFall = Math.max(
      0,
      ...getOwnedPlanets(player).map((planet) =>
        computeImmediateFallProbability(player, planet),
      ),
    );
    if (worstFall >= aiState.W.peaceThreatFloor) {
      return { type: 'PEACE', options: {}, ev: worstFall * 10 };
    }
  }
  const averageStrength = computeAverageStrength();
  for (const influenceType of [
    'SKIP_ARMY',
    'SKIP_PLANETS',
    'SKIP_TECH',
    'SKIP_INFLUENCE',
  ] as InfluenceType[]) {
    if ((player.hand[influenceType] || 0) < 1) {
      continue;
    }
    const target = getSkipTarget(player, influenceType);
    if (!target) {
      continue;
    }
    const isScary =
      computePlayerStrength(target) >= averageStrength * 1.15 ||
      isImminentAttacker(player, target) ||
      getAlivePlayers().length === 2;
    if (isScary) {
      return { type: influenceType, options: {}, ev: 3 };
    }
  }
  if ((player.hand.STEAL_ACTION || 0) > 0) {
    const rivals = getAlivePlayers().filter((rival) => rival.id !== player.id);
    const byDescendingStrength = (firstRival: Player, secondRival: Player) =>
      computePlayerStrength(secondRival) - computePlayerStrength(firstRival);
    const dangerousRivals = rivals
      .filter((rival) => isImminentAttacker(player, rival))
      .sort(byDescendingStrength);
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
        .sort(byDescendingStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          options: { target: holder, cardType: 'ATTACK' },
          ev: 2.5,
        };
      }
    }
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
        .sort(byDescendingStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          options: { target: holder, cardType: wantedCardType },
          ev: 2,
        };
      }
    }
  }
  return null;
}
