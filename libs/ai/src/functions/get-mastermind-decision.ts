import { getGameStateLastValue } from '@seven-planets/game';
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
import { getBestAttackNow } from './get-best-attack-now';
import { computeDesiredGarrison } from './compute-desired-garrison';
import { computeGarrisonFloor } from './compute-garrison-floor';
import { hasBuilding } from './has-building';
import { computeImmediateFallProbability } from './compute-immediate-fall-probability';
import { getInfluencePlay } from './get-influence-play';
import { getOwnedPlanets } from './get-owned-planets';
import { getPlan } from './get-plan';
import { getTradeOffer } from './get-trade-offer';

export type MastermindDecision =
  | { kind: 'influence'; type: InfluenceType; options: InfluenceOptions }
  | { kind: 'attack'; source: Planet; target: Planet; n: number }
  | { kind: 'recruit'; planet: Planet }
  | { kind: 'move'; from: Planet; to: Planet; n: number }
  | { kind: 'trade'; partner: Player; gives: Cost; gets: Cost };

export function getMastermindDecision(
  player: Player,
): MastermindDecision | null {
  activateWeightsFor(player);
  const plan = getPlan(player);
  const ownedPlanets = getOwnedPlanets(player);

  // 1. Influence cards
  const influenceDecision = getInfluencePlay(player);
  if (influenceDecision) {
    return {
      kind: 'influence',
      type: influenceDecision.type,
      options: influenceDecision.options,
    };
  }

  // 2. Strike
  if ((player.hand.ATTACK || 0) > 0) {
    const attackPlan = getBestAttackNow(player);
    if (attackPlan) {
      return {
        kind: 'attack',
        source: attackPlan.source,
        target: attackPlan.target,
        n: attackPlan.n,
      };
    }
  }

  // 3. Recruit
  if ((player.hand.RECRUIT || 0) > 0) {
    // Partial recruits are legal (short Ore musters fewer troops), so any
    // Barracks planet with 1⛏️ payable is worth an order.
    const canRecruitAt = (planet: Planet) =>
      (planet.buildings.BARRACKS || 0) > 0 &&
      computeRecruitableTroops(planet, player.hand) >= 1;
    const endangered = ownedPlanets
      .filter(
        (planet) =>
          canRecruitAt(planet) &&
          computeImmediateFallProbability(player, planet) >= 0.2,
      )
      .sort(
        (firstPlanet, secondPlanet) =>
          computeImmediateFallProbability(player, secondPlanet) -
          computeImmediateFallProbability(player, firstPlanet),
      );
    if (endangered.length > 0) {
      return { kind: 'recruit', planet: endangered[0] };
    }
    const isStacking =
      plan.kind === 'MILITARIZE' ||
      plan.kind === 'STRIKE' ||
      ((player.hand.ATTACK || 0) > 0 && plan.stagingId != null);
    const staging =
      plan.stagingId == null
        ? null
        : getGameStateLastValue().planets[plan.stagingId];
    if (
      isStacking &&
      staging &&
      staging.ownerId === player.id &&
      staging.troops <
        Math.max(plan.troopsNeeded, computeDesiredGarrison(player, staging))
    ) {
      if (canRecruitAt(staging)) {
        return { kind: 'recruit', planet: staging };
      }
      const anyRecruitable = ownedPlanets
        .filter(canRecruitAt)
        .sort(
          (firstPlanet, secondPlanet) =>
            (secondPlanet.buildings.BARRACKS || 0) -
            (firstPlanet.buildings.BARRACKS || 0),
        )[0];
      if (anyRecruitable) {
        return { kind: 'recruit', planet: anyRecruitable };
      }
    }
    const thinnestPlanet = ownedPlanets
      .filter(
        (planet) =>
          canRecruitAt(planet) &&
          planet.troops < computeDesiredGarrison(player, planet),
      )
      .sort(
        (firstPlanet, secondPlanet) =>
          firstPlanet.troops -
          computeDesiredGarrison(player, firstPlanet) -
          (secondPlanet.troops - computeDesiredGarrison(player, secondPlanet)),
      )[0];
    if (thinnestPlanet) {
      return { kind: 'recruit', planet: thinnestPlanet };
    }
  }

  // 4. Move
  if (
    (player.hand.MOVE || 0) > 0 &&
    hasBuilding(player, 'SPACEPORT') &&
    getOwnedPlanets(player).length >= 2
  ) {
    const troopFloor = computeGarrisonFloor();
    const endangered = ownedPlanets
      .filter(
        (planet) => computeImmediateFallProbability(player, planet) >= 0.3,
      )
      .sort(
        (firstPlanet, secondPlanet) =>
          computeImmediateFallProbability(player, secondPlanet) -
          computeImmediateFallProbability(player, firstPlanet),
      );
    for (const destination of endangered) {
      const donor = ownedPlanets
        .filter(
          (planet) =>
            planet !== destination &&
            (planet.buildings.SPACEPORT || 0) > 0 &&
            planet.troops > troopFloor + 2 &&
            computeImmediateFallProbability(player, planet) < 0.2,
        )
        .sort(
          (firstPlanet, secondPlanet) =>
            secondPlanet.troops - firstPlanet.troops,
        )[0];
      if (donor) {
        const troopsToMove = Math.min(
          getRocketCapacity(donor),
          donor.troops - troopFloor,
        );
        if (troopsToMove >= 1) {
          return {
            kind: 'move',
            from: donor,
            to: destination,
            n: troopsToMove,
          };
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
      staging.troops < Math.max(plan.troopsNeeded, troopFloor + 4)
    ) {
      const donor = ownedPlanets
        .filter(
          (planet) =>
            planet !== staging &&
            (planet.buildings.SPACEPORT || 0) > 0 &&
            planet.troops > troopFloor + 2,
        )
        .sort(
          (firstPlanet, secondPlanet) =>
            secondPlanet.troops - firstPlanet.troops,
        )[0];
      if (donor) {
        const troopsToStage = Math.min(
          getRocketCapacity(donor),
          donor.troops - troopFloor,
        );
        if (troopsToStage >= 2) {
          return { kind: 'move', from: donor, to: staging, n: troopsToStage };
        }
      }
    }
  }

  // 5. Trade
  if (
    !player.hasTradedCurrentTurn &&
    (player.hand.TRADE || 0) > 0 &&
    hasBuilding(player, 'EMBASSY')
  ) {
    const offer = getTradeOffer(player, plan);
    if (offer) {
      return { kind: 'trade', ...offer };
    }
  }
  return null;
}
