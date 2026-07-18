import type { Player } from '@seven-planets/game';
import { BUILD_ORDER, BUILDINGS, computeHandValue } from '@seven-planets/game';
import { sumBy } from 'lodash-es';

import { computeTotalTroops } from './compute-total-troops';
import { getOwnedPlanets } from './get-owned-planets';

const toResources = (player: Player): number => computeHandValue(player.hand);

const toMilitary = (player: Player): number => computeTotalTroops(player) * 1.5;

const toTerritory = (player: Player): number =>
  getOwnedPlanets(player).length * 8;

const toIncome = (player: Player): number =>
  sumBy(
    getOwnedPlanets(player),
    (planet) =>
      BUILD_ORDER.filter(
        (buildingType) =>
          planet.buildings[buildingType] && BUILDINGS[buildingType].income,
      ).length * 3,
  );

export const computePlayerStrength = (player: Player): number =>
  toResources(player) +
  toMilitary(player) +
  toTerritory(player) +
  toIncome(player);
