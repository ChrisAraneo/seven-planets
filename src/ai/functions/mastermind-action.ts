import { getGameState } from '@/stores/game-state';
import { getAiState } from '@/ai/state';
import { canAfford } from '@/game/config/constants';
import { recruitYield } from '@/game/functions/recruit-yield';
import { rocketCap } from '@/game/functions/rocket-cap';
import type {
  Cost,
  InfluenceOpts,
  InfluenceType,
  Planet,
  Player,
} from '@/game/types';

import { activateWeightsFor } from './activate-weights-for';
import { bestAttackNow } from './best-attack-now';
import { desiredGarrison } from './desired-garrison';
import { garrisonFloor } from './garrison-floor';
import { hasB } from './has-b';
import { immediateFallProb } from './immediate-fall-prob';
import { influencePlay } from './influence-play';
import { owned } from './owned';
import { planFor } from './plan-for';
import { planTradeOffer } from './plan-trade-offer';

export type MastermindDecision =
  | { kind: 'influence'; type: InfluenceType; opts: InfluenceOpts }
  | { kind: 'attack'; source: Planet; target: Planet; n: number }
  | { kind: 'recruit'; planet: Planet }
  | { kind: 'move'; from: Planet; to: Planet; n: number }
  | { kind: 'trade'; partner: Player; gives: Cost; gets: Cost };

export function mastermindAction(p: Player): MastermindDecision | null {
  activateWeightsFor(p);
  const plan = planFor(p);
  const pls = owned(p);

  // 1. Influence cards
  const inf = influencePlay(p);
  if (inf) {
    return { kind: 'influence', type: inf.type, opts: inf.opts };
  }

  // 2. Strike
  if ((p.hand.ATTACK || 0) > 0) {
    const atk = bestAttackNow(p);
    if (atk) {
      return {
        kind: 'attack',
        source: atk.source,
        target: atk.target,
        n: atk.n,
      };
    }
  }

  // 3. Recruit
  if ((p.hand.RECRUIT || 0) > 0) {
    const affordable = (pl: Planet) =>
      (pl.buildings.BARRACKS || 0) > 0 &&
      canAfford(p.hand, { ORE: recruitYield(pl) });
    const danger = pls
      .filter((pl) => affordable(pl) && immediateFallProb(p, pl) >= 0.2)
      .sort((a, b) => immediateFallProb(p, b) - immediateFallProb(p, a));
    if (danger.length > 0) {
      return { kind: 'recruit', planet: danger[0] };
    }
    const stacking =
      plan.kind === 'MILITARIZE' ||
      plan.kind === 'STRIKE' ||
      ((p.hand.ATTACK || 0) > 0 && plan.stagingId != null);
    const staging =
      plan.stagingId == null ? null : getGameState().planets[plan.stagingId];
    if (
      stacking &&
      staging &&
      staging.ownerId === p.id &&
      staging.troops < Math.max(plan.troopsNeeded, desiredGarrison(p, staging))
    ) {
      if (affordable(staging)) {
        return { kind: 'recruit', planet: staging };
      }
      const any = pls
        .filter(affordable)
        .sort(
          (a, b) => (b.buildings.BARRACKS || 0) - (a.buildings.BARRACKS || 0),
        )[0];
      if (any) {
        return { kind: 'recruit', planet: any };
      }
    }
    const thin = pls
      .filter((pl) => affordable(pl) && pl.troops < desiredGarrison(p, pl))
      .sort(
        (a, b) =>
          a.troops - desiredGarrison(p, a) - (b.troops - desiredGarrison(p, b)),
      )[0];
    if (thin) {
      return { kind: 'recruit', planet: thin };
    }
  }

  // 4. Move
  if ((p.hand.MOVE || 0) > 0 && hasB(p, 'SPACEPORT') && p.planets.length >= 2) {
    const floor = garrisonFloor();
    const inDanger = pls
      .filter((pl) => immediateFallProb(p, pl) >= 0.3)
      .sort((a, b) => immediateFallProb(p, b) - immediateFallProb(p, a));
    for (const dest of inDanger) {
      const donor = pls
        .filter(
          (pl) =>
            pl !== dest &&
            pl.troops > floor + 2 &&
            immediateFallProb(p, pl) < 0.2,
        )
        .sort((a, b) => b.troops - a.troops)[0];
      if (donor) {
        const n = Math.min(rocketCap(donor), donor.troops - floor);
        if (n >= 1) {
          return { kind: 'move', from: donor, to: dest, n };
        }
      }
    }
    const staging =
      plan.stagingId == null ? null : getGameState().planets[plan.stagingId];
    if (
      staging &&
      staging.ownerId === p.id &&
      staging.troops < Math.max(plan.troopsNeeded, floor + 4)
    ) {
      const donor = pls
        .filter((pl) => pl !== staging && pl.troops > floor + 2)
        .sort((a, b) => b.troops - a.troops)[0];
      if (donor) {
        const n = Math.min(rocketCap(donor), donor.troops - floor);
        if (n >= 2) {
          return { kind: 'move', from: donor, to: staging, n };
        }
      }
    }
  }

  // 5. Trade
  if (!p.tradedThisTurn && (p.hand.TRADE || 0) > 0 && hasB(p, 'EMBASSY')) {
    const offer = planTradeOffer(p, plan);
    if (offer) {
      return { kind: 'trade', ...offer };
    }
  }
  return null;
}
