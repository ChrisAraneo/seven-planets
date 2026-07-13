import { getAiState } from '../state';
import type { InfluenceOpts, InfluenceType, Player } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { avgStrength } from './avg-strength';
import { bestCoupTarget } from './best-coup-target';
import { hasB } from './has-b';
import { immediateFallProb } from './immediate-fall-prob';
import { isImminentAttacker } from './is-imminent-attacker';
import { owned } from './owned';
import { planFor } from './plan-for';
import { playerStrength } from './player-strength';
import { skipTarget } from './skip-target';
import { isUnderTruce } from './is-under-truce';

export function influencePlay(
  player: Player,
): { type: InfluenceType; opts: InfluenceOpts; ev: number } | null {
  const aiState = getAiState();
  const plan = planFor(player);
  if ((player.hand.COUP || 0) > 0) {
    const tgt = bestCoupTarget(player);
    if (tgt && tgt.value >= aiState.W.coupValueFloor) {
      return { type: 'COUP', opts: { planet: tgt.planet }, ev: tgt.value };
    }
  }
  if ((player.hand.PEACE || 0) > 0) {
    const worst = Math.max(
      0,
      ...owned(player).map((planet) => immediateFallProb(player, planet)),
    );
    if (worst >= aiState.W.peaceThreatFloor) {
      return { type: 'PEACE', opts: {}, ev: worst * 10 };
    }
  }
  const avg = avgStrength();
  for (const influenceType of [
    'SKIP_ARMY',
    'SKIP_PLANETS',
    'SKIP_TECH',
    'SKIP_INFLUENCE',
  ] as InfluenceType[]) {
    if ((player.hand[influenceType] || 0) < 1) {
      continue;
    }
    const target = skipTarget(player, influenceType);
    if (!target) {
      continue;
    }
    const scary =
      playerStrength(target) >= avg * 1.15 ||
      isImminentAttacker(player, target) ||
      getAlivePlayers().length === 2;
    if (scary) {
      return { type: influenceType, opts: {}, ev: 3 };
    }
  }
  if ((player.hand.STEAL_ACTION || 0) > 0) {
    const rivals = getAlivePlayers().filter(
      (player) => player.id !== player.id,
    );
    const byStrength = (player: Player, eachPlayer: Player) =>
      playerStrength(eachPlayer) - playerStrength(player);
    const danger = rivals
      .filter((player) => isImminentAttacker(player, player))
      .sort(byStrength);
    if (danger.length > 0) {
      return {
        type: 'STEAL_ACTION',
        opts: { target: danger[0], cardType: 'ATTACK' },
        ev: 3,
      };
    }
    if (
      (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
      (player.hand.ATTACK || 0) === 0 &&
      hasB(player, 'SILO')
    ) {
      const holder = rivals
        .filter((player) => (player.hand.ATTACK || 0) > 0)
        .sort(byStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          opts: { target: holder, cardType: 'ATTACK' },
          ev: 2.5,
        };
      }
    }
    const wants: ('RECRUIT' | 'TRADE')[] = [];
    if (hasB(player, 'BARRACKS') && (player.hand.RECRUIT || 0) === 0) {
      wants.push('RECRUIT');
    }
    if (hasB(player, 'EMBASSY') && (player.hand.TRADE || 0) === 0) {
      wants.push('TRADE');
    }
    for (const first of wants) {
      const holder = rivals
        .filter(
          (player) =>
            (player.hand[first] || 0) > 0 && playerStrength(player) >= avg,
        )
        .sort(byStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          opts: { target: holder, cardType: first },
          ev: 2,
        };
      }
    }
  }
  return null;
}
