import { getGameStateLastValue } from '@seven-planets/game';
import { getAiState } from '../state';
import { computeRecruitableTroops } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import type {
  Cost,
  InfluenceOptions,
  InfluenceType,
  Planet,
  Player,
} from '@seven-planets/game';

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
  | { kind: 'influence'; type: InfluenceType; options: InfluenceOptions }
  | { kind: 'attack'; source: Planet; target: Planet; n: number }
  | { kind: 'recruit'; planet: Planet }
  | { kind: 'move'; from: Planet; to: Planet; n: number }
  | { kind: 'trade'; partner: Player; gives: Cost; gets: Cost };

export function mastermindAction(player: Player): MastermindDecision | null {
  activateWeightsFor(player);
  const plan = planFor(player);
  const pls = owned(player);

  // 1. Influence cards
  const inf = influencePlay(player);
  if (inf) {
    return { kind: 'influence', type: inf.type, options: inf.options };
  }

  // 2. Strike
  if ((player.hand.ATTACK || 0) > 0) {
    const atk = bestAttackNow(player);
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
  if ((player.hand.RECRUIT || 0) > 0) {
    // Partial recruits are legal (short Ore musters fewer troops), so any
    // Barracks planet with 1⛏️ payable is worth an order.
    const affordable = (planet: Planet) =>
      (planet.buildings.BARRACKS || 0) > 0 &&
      computeRecruitableTroops(planet, player.hand) >= 1;
    const danger = pls
      .filter(
        (planet) =>
          affordable(planet) && immediateFallProb(player, planet) >= 0.2,
      )
      .sort(
        (planet, eachPlanet) =>
          immediateFallProb(player, eachPlanet) -
          immediateFallProb(player, planet),
      );
    if (danger.length > 0) {
      return { kind: 'recruit', planet: danger[0] };
    }
    const stacking =
      plan.kind === 'MILITARIZE' ||
      plan.kind === 'STRIKE' ||
      ((player.hand.ATTACK || 0) > 0 && plan.stagingId != null);
    const staging =
      plan.stagingId == null
        ? null
        : getGameStateLastValue().planets[plan.stagingId];
    if (
      stacking &&
      staging &&
      staging.ownerId === player.id &&
      staging.troops <
        Math.max(plan.troopsNeeded, desiredGarrison(player, staging))
    ) {
      if (affordable(staging)) {
        return { kind: 'recruit', planet: staging };
      }
      const any = pls
        .filter(affordable)
        .sort(
          (planet, eachPlanet) =>
            (eachPlanet.buildings.BARRACKS || 0) -
            (planet.buildings.BARRACKS || 0),
        )[0];
      if (any) {
        return { kind: 'recruit', planet: any };
      }
    }
    const thin = pls
      .filter(
        (planet) =>
          affordable(planet) && planet.troops < desiredGarrison(player, planet),
      )
      .sort(
        (planet, eachPlanet) =>
          planet.troops -
          desiredGarrison(player, planet) -
          (eachPlanet.troops - desiredGarrison(player, eachPlanet)),
      )[0];
    if (thin) {
      return { kind: 'recruit', planet: thin };
    }
  }

  // 4. Move
  if (
    (player.hand.MOVE || 0) > 0 &&
    hasB(player, 'SPACEPORT') &&
    owned(player).length >= 2
  ) {
    const floor = garrisonFloor();
    const inDanger = pls
      .filter((planet) => immediateFallProb(player, planet) >= 0.3)
      .sort(
        (planet, eachPlanet) =>
          immediateFallProb(player, eachPlanet) -
          immediateFallProb(player, planet),
      );
    for (const dest of inDanger) {
      const donor = pls
        .filter(
          (planet) =>
            planet !== dest &&
            (planet.buildings.SPACEPORT || 0) > 0 &&
            planet.troops > floor + 2 &&
            immediateFallProb(player, planet) < 0.2,
        )
        .sort((planet, eachPlanet) => eachPlanet.troops - planet.troops)[0];
      if (donor) {
        const count = Math.min(getRocketCapacity(donor), donor.troops - floor);
        if (count >= 1) {
          return { kind: 'move', from: donor, to: dest, n: count };
        }
      }
    }
    const staging =
      plan.stagingId == null
        ? null
        : getGameStateLastValue().planets[plan.stagingId];
    if (
      staging &&
      staging.ownerId === player.id &&
      staging.troops < Math.max(plan.troopsNeeded, floor + 4)
    ) {
      const donor = pls
        .filter(
          (planet) =>
            planet !== staging &&
            (planet.buildings.SPACEPORT || 0) > 0 &&
            planet.troops > floor + 2,
        )
        .sort((planet, eachPlanet) => eachPlanet.troops - planet.troops)[0];
      if (donor) {
        const eachCount = Math.min(
          getRocketCapacity(donor),
          donor.troops - floor,
        );
        if (eachCount >= 2) {
          return { kind: 'move', from: donor, to: staging, n: eachCount };
        }
      }
    }
  }

  // 5. Trade
  if (
    !player.hasTradedCurrentTurn &&
    (player.hand.TRADE || 0) > 0 &&
    hasB(player, 'EMBASSY')
  ) {
    const offer = planTradeOffer(player, plan);
    if (offer) {
      return { kind: 'trade', ...offer };
    }
  }
  return null;
}
