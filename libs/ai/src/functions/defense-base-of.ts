import { getGameStateLastValue } from '@seven-planets/game';
import { COMBAT, HOME_FIELD, PACIFIST_DEF_BONUS } from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';
import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';

export function defenseBaseOf(planet: Planet, troops = planet.troops): number {
  const pac = getPlayerByIndex(planet.ownerId)?.hasPacifistStatus
    ? PACIFIST_DEF_BONUS
    : 0;
  return (
    COMBAT.defensePerTroop * troops +
    computeShieldDefense(planet) +
    pac +
    computeSingularityDefenseBonus(planet) +
    HOME_FIELD
  );
}
