import type {
  Cost,
  InfluenceOptions,
  InfluenceType,
  Planet,
  Player,
} from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { computeRecruitableTroops } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';

import { activateWeightsFor } from './activate-weights-for';
import { computeDesiredGarrison } from './compute-desired-garrison';
import { computeGarrisonFloor } from './compute-garrison-floor';
import { computeImmediateFallProbability } from './compute-immediate-fall-probability';
import { getBestAttackNow } from './get-best-attack-now';
import { getInfluencePlay } from './get-influence-play';
import { getOwnedPlanets } from './get-owned-planets';
import { getPlan } from './get-plan';
import { getTradeOffer } from './get-trade-offer';
import { hasBuilding } from './has-building';

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
  return (
    getInfluenceDecision(player) ??
    getAttackDecision(player) ??
    getRecruitDecision(player) ??
    getMoveDecision(player) ??
    getTradeDecision(player)
  );
}

function getInfluenceDecision(player: Player): MastermindDecision | null {
  const influenceDecision = getInfluencePlay(player);
  if (!influenceDecision) {
    return null;
  }
  return {
    kind: 'influence',
    type: influenceDecision.type,
    options: influenceDecision.options,
  };
}

function getAttackDecision(player: Player): MastermindDecision | null {
  if ((player.hand.ATTACK || 0) < 1) {
    return null;
  }
  const attackPlan = getBestAttackNow(player);
  if (!attackPlan) {
    return null;
  }
  return {
    kind: 'attack',
    source: attackPlan.source,
    target: attackPlan.target,
    n: attackPlan.n,
  };
}

// The plan's staging planet, re-resolved on the live snapshot.
function getStagingPlanet(player: Player): Planet | null {
  const plan = getPlan(player);
  return plan.stagingId === null
    ? null
    : getGameStateLastValue().planets[plan.stagingId];
}

// Partial recruits are legal (short Ore musters fewer troops), so any
// Barracks planet with 1⛏️ payable is worth an order.
function canRecruitAt(player: Player, planet: Planet): boolean {
  return (
    (planet.buildings.BARRACKS || 0) > 0 &&
    computeRecruitableTroops(planet, player.hand) >= 1
  );
}

function getRecruitDecision(player: Player): MastermindDecision | null {
  if ((player.hand.RECRUIT || 0) < 1) {
    return null;
  }
  const ownedPlanets = getOwnedPlanets(player);
  const endangered = ownedPlanets
    .filter(
      (planet) =>
        canRecruitAt(player, planet) &&
        computeImmediateFallProbability(player, planet) >= 0.2,
    )
    .toSorted(
      (firstPlanet, secondPlanet) =>
        computeImmediateFallProbability(player, secondPlanet) -
        computeImmediateFallProbability(player, firstPlanet),
    )
    .at(0);
  if (endangered) {
    return { kind: 'recruit', planet: endangered };
  }
  return (
    getStagingRecruit(player, ownedPlanets) ??
    getThinnestRecruit(player, ownedPlanets)
  );
}

function getStagingRecruit(
  player: Player,
  ownedPlanets: Planet[],
): MastermindDecision | null {
  const plan = getPlan(player);
  const isStacking =
    plan.kind === 'MILITARIZE' ||
    plan.kind === 'STRIKE' ||
    ((player.hand.ATTACK || 0) > 0 && plan.stagingId !== null);
  const staging = getStagingPlanet(player);
  if (
    !isStacking ||
    !staging ||
    staging.ownerId !== player.id ||
    staging.troops >=
      Math.max(plan.troopsNeeded, computeDesiredGarrison(player, staging))
  ) {
    return null;
  }
  if (canRecruitAt(player, staging)) {
    return { kind: 'recruit', planet: staging };
  }
  const anyRecruitable = ownedPlanets
    .filter((planet) => canRecruitAt(player, planet))
    .toSorted(
      (firstPlanet, secondPlanet) =>
        (secondPlanet.buildings.BARRACKS || 0) -
        (firstPlanet.buildings.BARRACKS || 0),
    )
    .at(0);
  return anyRecruitable ? { kind: 'recruit', planet: anyRecruitable } : null;
}

function getThinnestRecruit(
  player: Player,
  ownedPlanets: Planet[],
): MastermindDecision | null {
  const thinnestPlanet = ownedPlanets
    .filter(
      (planet) =>
        canRecruitAt(player, planet) &&
        planet.troops < computeDesiredGarrison(player, planet),
    )
    .toSorted(
      (firstPlanet, secondPlanet) =>
        firstPlanet.troops -
        computeDesiredGarrison(player, firstPlanet) -
        (secondPlanet.troops - computeDesiredGarrison(player, secondPlanet)),
    )
    .at(0);
  return thinnestPlanet ? { kind: 'recruit', planet: thinnestPlanet } : null;
}

function getMoveDecision(player: Player): MastermindDecision | null {
  const canMove =
    (player.hand.MOVE || 0) > 0 &&
    hasBuilding(player, 'SPACEPORT') &&
    getOwnedPlanets(player).length >= 2;
  if (!canMove) {
    return null;
  }
  return getRescueMove(player) ?? getStagingMove(player);
}

function getRescueMove(player: Player): MastermindDecision | null {
  const ownedPlanets = getOwnedPlanets(player);
  const troopFloor = computeGarrisonFloor();
  const endangered = ownedPlanets
    .filter((planet) => computeImmediateFallProbability(player, planet) >= 0.3)
    .toSorted(
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
      .toSorted(
        (firstPlanet, secondPlanet) => secondPlanet.troops - firstPlanet.troops,
      )
      .at(0);
    if (donor) {
      const troopsToMove = Math.min(
        getRocketCapacity(donor),
        donor.troops - troopFloor,
      );
      if (troopsToMove >= 1) {
        return { kind: 'move', from: donor, to: destination, n: troopsToMove };
      }
    }
  }
  return null;
}

function getStagingMove(player: Player): MastermindDecision | null {
  const ownedPlanets = getOwnedPlanets(player);
  const troopFloor = computeGarrisonFloor();
  const plan = getPlan(player);
  const staging = getStagingPlanet(player);
  if (
    !staging ||
    staging.ownerId !== player.id ||
    staging.troops >= Math.max(plan.troopsNeeded, troopFloor + 4)
  ) {
    return null;
  }
  const donor = ownedPlanets
    .filter(
      (planet) =>
        planet !== staging &&
        (planet.buildings.SPACEPORT || 0) > 0 &&
        planet.troops > troopFloor + 2,
    )
    .toSorted(
      (firstPlanet, secondPlanet) => secondPlanet.troops - firstPlanet.troops,
    )
    .at(0);
  if (!donor) {
    return null;
  }
  const troopsToStage = Math.min(
    getRocketCapacity(donor),
    donor.troops - troopFloor,
  );
  return troopsToStage >= 2
    ? { kind: 'move', from: donor, to: staging, n: troopsToStage }
    : null;
}

function getTradeDecision(player: Player): MastermindDecision | null {
  const canTrade =
    !player.hasTradedCurrentTurn &&
    (player.hand.TRADE || 0) > 0 &&
    hasBuilding(player, 'EMBASSY');
  if (!canTrade) {
    return null;
  }
  const offer = getTradeOffer(player, getPlan(player));
  return offer ? { kind: 'trade', ...offer } : null;
}
